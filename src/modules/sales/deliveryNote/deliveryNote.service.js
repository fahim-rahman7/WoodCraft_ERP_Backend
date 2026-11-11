import { DeliveryNote } from './deliveryNote.model.js';
import { SalesOrder } from '../salesOrder/salesOrder.model.js';
import { Item } from '../../inventory/item/item.model.js';
import { Warehouse } from '../../inventory/warehouse/warehouse.model.js';
import mongoose from 'mongoose';

// Models for inventory stock & movement integration
// (Ensure these models exist in your inventory module or adjust paths)
import { Stock } from '../../inventory/stock/stock.model.js'; // Adjust if path differs
import { StockMovement } from '../../inventory/stockMovement/stockMovement.model.js'; // Adjust if path differs

// Helper to generate unique delivery number
const generateDeliveryNumber = async (organizationId) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await DeliveryNote.countDocuments({ organizationId });
  const paddedSeq = String(count + 1).padStart(4, '0');
  return `DN-${dateStr}-${paddedSeq}`;
};

export const createDeliveryNoteService = async (organizationId, userId, payload) => {
  // 1. Verify Sales Order
  const salesOrder = await SalesOrder.findOne({ _id: payload.salesOrderId, organizationId });
  if (!salesOrder) {
    const error = new Error('Sales Order not found.');
    error.statusCode = 404;
    throw error;
  }

  if (!['CONFIRMED', 'PARTIALLY_DELIVERED'].includes(salesOrder.status)) {
    const error = new Error(`Cannot create delivery note for an order with status: ${salesOrder.status}`);
    error.statusCode = 400;
    throw error;
  }

  // 2. Verify Warehouse
  const warehouse = await Warehouse.findOne({ _id: payload.warehouseId, organizationId });
  if (!warehouse) {
    const error = new Error('Warehouse not found in this organization.');
    error.statusCode = 404;
    throw error;
  }

  // 3. Validate items and build snapshots
  const enrichedItems = [];
  for (const rawItem of payload.items) {
    // Check if salesOrderItemId exists in Sales Order items
    const soItem = salesOrder.items.id(rawItem.salesOrderItemId);
    if (!soItem) {
      const error = new Error(`Sales Order Item ID ${rawItem.salesOrderItemId} not found in this order.`);
      error.statusCode = 400;
      throw error;
    }

    // Check remaining quantity
    const remainingQty = soItem.orderedQuantity - soItem.deliveredQuantity;
    if (rawItem.quantity > remainingQty) {
      const error = new Error(`Requested quantity (${rawItem.quantity}) exceeds remaining undelivered quantity (${remainingQty}) for item ${soItem.name}.`);
      error.statusCode = 400;
      throw error;
    }

    const itemMaster = await Item.findOne({ _id: rawItem.itemId, organizationId });
    if (!itemMaster) {
      const error = new Error(`Item ID ${rawItem.itemId} not found.`);
      error.statusCode = 404;
      throw error;
    }

    enrichedItems.push({
      salesOrderItemId: soItem._id,
      itemId: itemMaster._id,
      name: itemMaster.name,
      unit: itemMaster.unit || 'PCS',
      quantity: rawItem.quantity,
      batchId: rawItem.batchId,
    });
  }

  const deliveryNumber = await generateDeliveryNumber(organizationId);

  // 4. Create Delivery Note in DRAFT status (Does not affect stock yet)[cite: 11]
  const deliveryNote = await DeliveryNote.create({
    organizationId,
    deliveryNumber,
    salesOrderId: salesOrder._id,
    customerId: salesOrder.customerId,
    warehouseId: payload.warehouseId,
    items: enrichedItems,
    status: 'DRAFT',
    remarks: payload.remarks,
    createdBy: userId,
  });

  return deliveryNote;
};

export const getDeliveryNotesService = async (organizationId, query = {}) => {
  const { status, salesOrderId, customerId, page = 1, limit = 10 } = query;
  const filter = { organizationId };

  if (status) filter.status = status;
  if (salesOrderId) filter.salesOrderId = salesOrderId;
  if (customerId) filter.customerId = customerId;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [deliveryNotes, total] = await Promise.all([
    DeliveryNote.find(filter)
      .populate('customerId', 'name customerCode')
      .populate('warehouseId', 'name')
      .populate('salesOrderId', 'orderNumber status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    DeliveryNote.countDocuments(filter),
  ]);

  return {
    deliveryNotes,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getDeliveryNoteByIdService = async (organizationId, deliveryNoteId) => {
  const deliveryNote = await DeliveryNote.findOne({ _id: deliveryNoteId, organizationId })
    .populate('customerId')
    .populate('warehouseId')
    .populate('salesOrderId')
    .populate('createdBy', 'name email')
    .populate('dispatchedBy', 'name email');

  if (!deliveryNote) {
    const error = new Error('Delivery Note not found.');
    error.statusCode = 404;
    throw error;
  }
  return deliveryNote;
};

// CRITICAL DISPATCH ACTION: Interacts with Inventory Stock Service & Transaction[cite: 11, 15]
export const dispatchDeliveryNoteService = async (organizationId, userId, deliveryNoteId) => {
  const deliveryNote = await DeliveryNote.findOne({ _id: deliveryNoteId, organizationId });
  if (!deliveryNote) {
    const error = new Error('Delivery Note not found.');
    error.statusCode = 404;
    throw error;
  }

  // Idempotency check: Prevent double deduction if already dispatched[cite: 11]
  if (deliveryNote.status === 'DISPATCHED') {
    const error = new Error('This delivery note has already been dispatched.');
    error.statusCode = 400;
    throw error;
  }

  if (deliveryNote.status !== 'DRAFT' && deliveryNote.status !== 'READY') {
    const error = new Error(`Cannot dispatch delivery note with status: ${deliveryNote.status}`);
    error.statusCode = 400;
    throw error;
  }

  const salesOrder = await SalesOrder.findOne({ _id: deliveryNote.salesOrderId, organizationId });
  if (!salesOrder) {
    const error = new Error('Associated Sales Order not found.');
    error.statusCode = 404;
    throw error;
  }

  // Start MongoDB Transaction for atomic operation
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Recheck available stock for each item in the warehouse and decrease stock
    for (const dnItem of deliveryNote.items) {
      const stockRecord = await Stock.findOne({
        organizationId,
        warehouseId: deliveryNote.warehouseId,
        itemId: dnItem.itemId,
      }).session(session);

      if (!stockRecord || stockRecord.availableQuantity < dnItem.quantity) {
        throw new Error(`Insufficient stock for item ID ${dnItem.itemId} in warehouse. Available: ${stockRecord?.availableQuantity || 0}, Required: ${dnItem.quantity}`);
      }

      // Decrease stock
      stockRecord.availableQuantity -= dnItem.quantity;
      await stockRecord.save({ session });

      // Create Stock Movement record (SALES_DELIVERY)[cite: 15]
      await StockMovement.create(
        [{
          organizationId,
          itemId: dnItem.itemId,
          warehouseId: deliveryNote.warehouseId,
          quantity: dnItem.quantity,
          movementType: 'SALES_DELIVERY',
          referenceType: 'DELIVERY_Note',
          referenceId: deliveryNote._id,
          balanceAfter: stockRecord.availableQuantity,
          batchId: dnItem.batchId,
          performedBy: userId,
          notes: `Dispatched via Delivery Note ${deliveryNote.deliveryNumber}`,
        }],
        { session }
      );

      // Update Sales Order item deliveredQuantity
      const soItem = salesOrder.items.id(dnItem.salesOrderItemId);
      if (soItem) {
        soItem.deliveredQuantity += dnItem.quantity;
      }
    }

    // 2. Check if Sales Order is fully or partially delivered
    let allDelivered = true;
    for (const soItem of salesOrder.items) {
      if (soItem.deliveredQuantity < soItem.orderedQuantity) {
        allDelivered = false;
        break;
      }
    }

    salesOrder.status = allDelivered ? 'DELIVERED' : 'PARTIALLY_DELIVERED';
    await salesOrder.save({ session });

    // 3. Mark Delivery Note as DISPATCHED
    deliveryNote.status = 'DISPATCHED';
    deliveryNote.dispatchDate = new Date();
    deliveryNote.dispatchedBy = userId;
    await deliveryNote.save({ session });

    await session.commitTransaction();
    session.endSession();

    return deliveryNote;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};