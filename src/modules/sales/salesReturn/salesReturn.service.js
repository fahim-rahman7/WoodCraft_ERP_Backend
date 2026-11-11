import { SalesReturn } from './salesReturn.model.js';
import { SalesOrder } from '../salesOrder/salesOrder.model.js';
import { Item } from '../../inventory/item/item.model.js';
import { Warehouse } from '../../inventory/warehouse/warehouse.model.js';
import mongoose from 'mongoose';

// Inventory integration models
import { Stock } from '../../inventory/stock/stock.model.js';
import { StockMovement } from '../../inventory/stockMovement/stockMovement.model.js';

// Helper to generate unique return number
const generateReturnNumber = async (organizationId) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await SalesReturn.countDocuments({ organizationId });
  const paddedSeq = String(count + 1).padStart(4, '0');
  return `RET-${dateStr}-${paddedSeq}`;
};

export const createSalesReturnService = async (organizationId, userId, payload) => {
  const salesOrder = await SalesOrder.findOne({ _id: payload.salesOrderId, organizationId });
  if (!salesOrder) {
    const error = new Error('Sales Order not found.');
    error.statusCode = 404;
    throw error;
  }

  const warehouse = await Warehouse.findOne({ _id: payload.warehouseId, organizationId });
  if (!warehouse) {
    const error = new Error('Warehouse not found.');
    error.statusCode = 404;
    throw error;
  }

  const enrichedItems = [];
  for (const rawItem of payload.items) {
    const itemMaster = await Item.findOne({ _id: rawItem.itemId, organizationId });
    if (!itemMaster) {
      const error = new Error(`Item ID ${rawItem.itemId} not found.`);
      error.statusCode = 404;
      throw error;
    }

    enrichedItems.push({
      itemId: itemMaster._id,
      name: itemMaster.name,
      unit: itemMaster.unit || 'PCS',
      requestedQuantity: rawItem.requestedQuantity,
      reason: rawItem.reason || '',
    });
  }

  const returnNumber = await generateReturnNumber(organizationId);

  const salesReturn = await SalesReturn.create({
    organizationId,
    returnNumber,
    customerId: salesOrder.customerId,
    salesOrderId: salesOrder._id,
    deliveryNoteId: payload.deliveryNoteId || null,
    warehouseId: payload.warehouseId,
    items: enrichedItems,
    status: 'REQUESTED',
    createdBy: userId,
  });

  return salesReturn;
};

export const getSalesReturnsService = async (organizationId, query = {}) => {
  const { status, salesOrderId, customerId, page = 1, limit = 10 } = query;
  const filter = { organizationId };

  if (status) filter.status = status;
  if (salesOrderId) filter.salesOrderId = salesOrderId;
  if (customerId) filter.customerId = customerId;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [returns, total] = await Promise.all([
    SalesReturn.find(filter)
      .populate('customerId', 'name customerCode')
      .populate('salesOrderId', 'orderNumber')
      .populate('warehouseId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    SalesReturn.countDocuments(filter),
  ]);

  return {
    returns,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getSalesReturnByIdService = async (organizationId, returnId) => {
  const salesReturn = await SalesReturn.findOne({ _id: returnId, organizationId })
    .populate('customerId')
    .populate('salesOrderId')
    .populate('warehouseId')
    .populate('createdBy', 'name email')
    .populate('inspectedBy', 'name email');

  if (!salesReturn) {
    const error = new Error('Sales Return record not found.');
    error.statusCode = 404;
    throw error;
  }
  return salesReturn;
};

export const approveSalesReturnService = async (organizationId, returnId) => {
  const salesReturn = await SalesReturn.findOne({ _id: returnId, organizationId });
  if (!salesReturn) {
    const error = new Error('Sales Return not found.');
    error.statusCode = 404;
    throw error;
  }

  if (salesReturn.status !== 'REQUESTED') {
    const error = new Error(`Cannot approve return with status: ${salesReturn.status}`);
    error.statusCode = 400;
    throw error;
  }

  salesReturn.status = 'APPROVED';
  await salesReturn.save();
  return salesReturn;
};

export const receiveSalesReturnService = async (organizationId, returnId, payload) => {
  const salesReturn = await SalesReturn.findOne({ _id: returnId, organizationId });
  if (!salesReturn) {
    const error = new Error('Sales Return not found.');
    error.statusCode = 404;
    throw error;
  }

  if (salesReturn.status !== 'APPROVED') {
    const error = new Error('Return request must be APPROVED before receiving physical goods.');
    error.statusCode = 400;
    throw error;
  }

  for (const recItem of payload.items) {
    const itemSub = salesReturn.items.find((i) => i.itemId.toString() === recItem.itemId);
    if (!itemSub) {
      const error = new Error(`Item ID ${recItem.itemId} does not belong to this return.`);
      error.statusCode = 400;
      throw error;
    }
    if (recItem.receivedQuantity > itemSub.requestedQuantity) {
      const error = new Error(`Received quantity cannot exceed requested quantity for item ${itemSub.name}.`);
      error.statusCode = 400;
      throw error;
    }
    itemSub.receivedQuantity = recItem.receivedQuantity;
  }

  salesReturn.status = 'RECEIVED';
  salesReturn.receivedAt = new Date();
  await salesReturn.save();
  return salesReturn;
};

// CRITICAL INSPECTION & DISPOSITION: Increases stock ONLY if disposition is RESTOCK[cite: 12, 13, 15]
export const inspectSalesReturnService = async (organizationId, userId, returnId, payload) => {
  const salesReturn = await SalesReturn.findOne({ _id: returnId, organizationId });
  if (!salesReturn) {
    const error = new Error('Sales Return not found.');
    error.statusCode = 404;
    throw error;
  }

  if (salesReturn.status !== 'RECEIVED') {
    const error = new Error('Goods must be RECEIVED before inspection.');
    error.statusCode = 400;
    throw error;
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    for (const inspItem of payload.items) {
      const itemSub = salesReturn.items.find((i) => i.itemId.toString() === inspItem.itemId);
      if (!itemSub) {
        throw new Error(`Item ID ${inspItem.itemId} not found in return record.`);
      }

      if (inspItem.acceptedQuantity > itemSub.receivedQuantity) {
        throw new Error(`Accepted quantity cannot exceed received quantity for item ${itemSub.name}.`);
      }

      itemSub.acceptedQuantity = inspItem.acceptedQuantity;
      itemSub.condition = inspItem.condition;
      itemSub.disposition = inspItem.disposition;

      // If disposition is RESTOCK, increase usable inventory stock and create stock movement[cite: 12, 13, 15]
      if (inspItem.disposition === 'RESTOCK' && inspItem.acceptedQuantity > 0) {
        let stockRecord = await Stock.findOne({
          organizationId,
          warehouseId: salesReturn.warehouseId,
          itemId: inspItem.itemId,
        }).session(session);

        if (!stockRecord) {
          stockRecord = new Stock({
            organizationId,
            warehouseId: salesReturn.warehouseId,
            itemId: inspItem.itemId,
            availableQuantity: 0,
            reservedQuantity: 0,
          });
        }

        stockRecord.availableQuantity += inspItem.acceptedQuantity;
        await stockRecord.save({ session });

        await StockMovement.create(
          [{
            organizationId,
            itemId: inspItem.itemId,
            warehouseId: salesReturn.warehouseId,
            quantity: inspItem.acceptedQuantity,
            type: 'SALES_RETURN_IN', // Stock movement type for return restock
            referenceModel: 'SalesReturn',
            referenceId: salesReturn._id,
            performedBy: userId,
            notes: `Restocked from Sales Return ${salesReturn.returnNumber}`,
          }],
          { session }
        );
      }
    }

    salesReturn.status = 'INSPECTED';
    salesReturn.inspectedBy = userId;
    await salesReturn.save({ session });

    await session.commitTransaction();
    session.endSession();

    return salesReturn;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

export const closeSalesReturnService = async (organizationId, returnId) => {
  const salesReturn = await SalesReturn.findOne({ _id: returnId, organizationId });
  if (!salesReturn) {
    const error = new Error('Sales Return not found.');
    error.statusCode = 404;
    throw error;
  }

  if (salesReturn.status !== 'INSPECTED') {
    const error = new Error(`Cannot close return with status: ${salesReturn.status}`);
    error.statusCode = 400;
    throw error;
  }

  salesReturn.status = 'CLOSED';
  salesReturn.closedAt = new Date();
  await salesReturn.save();
  return salesReturn;
};