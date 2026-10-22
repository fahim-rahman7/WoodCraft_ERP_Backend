import mongoose from 'mongoose';
import { ProductionOrder } from './productionOrder.model.js';
import { BOM as Bom } from '../bom/bom.model.js'; 
import { Stock } from '../../inventory/stock/stock.model.js';
import { Warehouse } from '../../inventory/warehouse/warehouse.model.js';
import { Item } from '../../inventory/item/item.model.js';
import { Batch } from '../../inventory/batch/batch.model.js'; // 🆕 Batch model import
import * as stockService from '../../inventory/stock/stock.service.js';
import { AppError } from '../../../utils/appError.js';
import { MaterialIssue } from '../materialIssue/materialIssue.model.js';

const generateOrderNumber = async (organizationId) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await ProductionOrder.countDocuments({ organizationId });
  const sequence = String(count + 1).padStart(4, '0');
  return `PO-PRD-${dateStr}-${sequence}`;
};

export const createProductionOrder = async (organizationId, userId, payload) => {
  // ১. Warehouse & Target Item যাচাই
  const warehouseExists = await Warehouse.findOne({ _id: payload.warehouseId, organizationId, status: 'ACTIVE' });
  if (!warehouseExists) throw new AppError('Warehouse not found or inactive', 404);

  const targetItem = await Item.findOne({ _id: payload.targetItemId, organizationId, status: 'ACTIVE' });
  if (!targetItem) throw new AppError('Target item not found', 404);

  // ২. BOM খুঁজে বের করা
  let bomQuery = { organizationId, status: 'ACTIVE' };
  if (payload.bomId) {
    bomQuery._id = payload.bomId;
  } else {
    bomQuery.finishedItemId = payload.targetItemId; 
  }

  const bom = await Bom.findOne(bomQuery);
  if (!bom) {
    throw new AppError('No active BOM found for this product', 404);
  }

  // ৩. BOM Calculation
  const multiplier = payload.targetQuantity / (bom.quantity || 1);
  const calculatedMaterials = [];

  // ৪. Check Stock across all batches for each component
  for (const component of bom.components) {
    const requiredQty = component.quantity * multiplier;

    // 🆕 যেহেতু স্টক ব্যাচ-ওয়াইজ আলাদা, তাই সব ব্যাচ থেকে স্টক কুয়েরি করে যোগ করতে হবে
    const stockRecords = await Stock.find({
      organizationId,
      warehouseId: payload.warehouseId,
      itemId: component.itemId,
    });

    const currentStock = stockRecords.reduce((sum, record) => sum + record.availableQuantity, 0);

    calculatedMaterials.push({
      itemId: component.itemId,
      requiredQuantity: requiredQty,
      availableQuantity: currentStock,
      isStockSufficient: currentStock >= requiredQty,
    });
  }

  const orderNumber = await generateOrderNumber(organizationId);

  return await ProductionOrder.create({
    organizationId,
    orderNumber,
    targetItemId: payload.targetItemId,
    bomId: bom._id,
    targetQuantity: payload.targetQuantity,
    warehouseId: payload.warehouseId,
    requiredMaterials: calculatedMaterials,
    startDate: payload.startDate,
    dueDate: payload.dueDate,
    status: 'DRAFT',
    createdBy: userId,
    remarks: payload.remarks,
  });
};

export const getProductionOrders = async (organizationId, query = {}) => {
  const filter = { organizationId };
  if (query.warehouseId) filter.warehouseId = query.warehouseId;
  if (query.status) filter.status = query.status;

  return await ProductionOrder.find(filter)
    .populate('warehouseId', 'name code')
    .populate('targetItemId', 'name sku unit')
    .populate('bomId', 'bomNumber')
    .populate('requiredMaterials.itemId', 'name sku unit')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
};

export const getProductionOrderById = async (organizationId, id) => {
  const order = await ProductionOrder.findOne({ _id: id, organizationId })
    .populate('warehouseId', 'name code location')
    .populate('targetItemId', 'name sku unit category')
    .populate('bomId', 'bomNumber quantity components')
    .populate('requiredMaterials.itemId', 'name sku unit category')
    .populate('createdBy', 'name email');

  if (!order) throw new AppError('Production Order not found', 404);
  return order;
};

export const startProduction = async (organizationId, id) => {
  const order = await ProductionOrder.findOne({ _id: id, organizationId });

  if (!order) throw new AppError('Production Order not found', 404);
  if (order.status !== 'DRAFT' && order.status !== 'PLANNED') {
    throw new AppError(`Cannot start production with status '${order.status}'`, 400);
  }

  const hasInsufficientMaterial = order.requiredMaterials.some((mat) => !mat.isStockSufficient);
  if (hasInsufficientMaterial) {
    throw new AppError('Insufficient raw material stock to start production', 400);
  }

  order.status = 'IN_PRODUCTION';
  if (!order.startDate) order.startDate = new Date();
  await order.save();

  return order;
};

export const completeProduction = async (organizationId, userId, id, payload = {}) => {
  const order = await ProductionOrder.findOne({ _id: id, organizationId });

  if (!order) throw new AppError('Production Order not found', 404);
  if (order.status !== 'IN_PRODUCTION') {
    throw new AppError(`Cannot complete production from status '${order.status}'`, 400);
  }

  // Strict Validation: Check if Material Issue (MIN) exists and is ISSUED for this production order
  const minExists = await MaterialIssue.findOne({
    productionOrderId: id,
    organizationId,
    status: 'ISSUED', //  system-er issued status onujayi ekhane status check hobe
  });

  if (!minExists) {
    throw new AppError('Cannot complete production order without issuing raw materials via Material Issue (MIN)', 400);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ফিনিশড গুডসের জন্য নতুন ব্যাচ তৈরি করা (যেমন: FG-PO-PRD-20261015-0001)
    const batchNumber = payload.batchNumber || `FG-${order.orderNumber}`;

    const existingBatch = await Batch.findOne({ organizationId, batchNumber }).session(session);
    if (existingBatch) {
      throw new AppError(`Batch number '${batchNumber}' already exists`, 400);
    }

    const [newBatch] = await Batch.create(
      [{
        organizationId,
        batchNumber,
        itemId: order.targetItemId,
        warehouseId: order.warehouseId,
        initialQuantity: order.targetQuantity,
        currentQuantity: order.targetQuantity,
        receivedDate: new Date(),
        status: 'ACTIVE',
        remarks: `Produced via Production Order: ${order.orderNumber}`,
      }],
      { session }
    );

    // ফিনিশড গুডস স্টকে যোগ করা (নতুন ব্যাচ আইডি সহ)
    await stockService.increaseStock(
      {
        organizationId,
        warehouseId: order.warehouseId,
        itemId: order.targetItemId,
        batchId: newBatch._id, // Pass newly created batchId
        quantity: order.targetQuantity,
        referenceType: 'PRODUCTION_RECEIPT',
        referenceId: order._id,
        performedBy: userId,
        remarks: `Finished goods produced via PO: ${order.orderNumber}, Batch: ${batchNumber}`,
      },
      session
    );

    // ৩. অর্ডার স্ট্যাটাস আপডেট করা
    order.status = 'COMPLETED';
    order.producedBatchId = newBatch._id;
    order.completedAt = new Date();
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    return order;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};