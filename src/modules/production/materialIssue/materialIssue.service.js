import mongoose from 'mongoose';
import { MaterialIssue } from './materialIssue.model.js';
import { Warehouse } from '../../inventory/warehouse/warehouse.model.js';
import { Item } from '../../inventory/item/item.model.js';
import { Batch } from '../../inventory/batch/batch.model.js'; // 🆕 Batch model import
import * as stockService from '../../inventory/stock/stock.service.js';
import { AppError } from '../../../utils/appError.js';
import { Stock } from '../../inventory/stock/stock.model.js';
import { ProductionOrder } from '../productionOrder/productionOrder.model.js';

const generateIssueNumber = async (organizationId) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await MaterialIssue.countDocuments({ organizationId });
  const sequence = String(count + 1).padStart(4, '0');
  return `MIN-${dateStr}-${sequence}`;
};

export const createMaterialIssue = async (organizationId, userId, payload) => {
  // 1. Check if Warehouse exists
  const warehouseExists = await Warehouse.findOne({
    _id: payload.warehouseId,
    organizationId,
  });
  if (!warehouseExists) {
    throw new AppError('Warehouse not found', 404);
  }

  // 2. Check if Production Order exists
  const prodOrder = await ProductionOrder.findOne({
    _id: payload.productionOrderId,
    organizationId,
  });
  if (!prodOrder) {
    throw new AppError('Production Order not found', 404);
  }

  // 3. Ensure Production Order is IN_PRODUCTION
  if (prodOrder.status !== 'IN_PRODUCTION') {
    throw new AppError(`Cannot create Material Issue for a ${prodOrder.status.toLowerCase()} Production Order`, 400);
  }

  // 🆕 4. Fetch all existing Material Issues for this Production Order to calculate already requested/issued quantities
  const existingMaterialIssues = await MaterialIssue.find({
    productionOrderId: payload.productionOrderId,
    organizationId,
    status: { $ne: 'CANCELLED' }, // Cancelled baade baki shob active/draft issues gulo count korbe
  });

  // Map to track total quantity per itemId across existing material issues
  const issuedMap = {};
  existingMaterialIssues.forEach(issue => {
    issue.items.forEach(i => {
      const key = i.itemId.toString();
      issuedMap[key] = (issuedMap[key] || 0) + i.quantity;
    });
  });

  // 5. Validate Item, Stock, Batch, and BOM Limit
  for (const item of payload.items) {
    const itemExist = await Item.findOne({ _id: item.itemId, organizationId, status: "ACTIVE" });
    if (!itemExist) throw new AppError(`Item not found with ID: ${item.itemId}`, 404);

    // Check if this item exists in Production Order's requiredMaterials (BOM)
    const prodRequiredItem = prodOrder.requiredMaterials.find(
      rm => rm.itemId.toString() === item.itemId.toString()
    );
    if (!prodRequiredItem) {
      throw new AppError(`Item ID ${item.itemId} is not required for this Production Order`, 400);
    }

    // Calculate total accumulated quantity (Already requested + New requested)
    const alreadyIssued = issuedMap[item.itemId.toString()] || 0;
    const totalRequested = alreadyIssued + item.quantity;

    if (totalRequested > prodRequiredItem.requiredQuantity) {
      throw new AppError(
        `Total requested quantity (${totalRequested}) for item exceeds Production Order required limit (${prodRequiredItem.requiredQuantity}). Already issued/drafted: ${alreadyIssued}`,
        400
      );
    }

    // Check if stock exists for this item, warehouse, and batch with enough quantity
    const stockExist = await Stock.findOne({
      organizationId,
      warehouseId: payload.warehouseId,
      itemId: item.itemId,
      batchId: item.batchId,
    });

    if (!stockExist || stockExist.availableQuantity < item.quantity) {
      throw new AppError(`Not enough stock or batch not found in this warehouse for item ID: ${item.itemId}`, 400);
    }

    // Verify batch is active
    const batchExist = await Batch.findOne({ _id: item.batchId, organizationId, status: "ACTIVE" });
    if (!batchExist) {
      throw new AppError(`Batch is inactive or not found for item ID: ${item.itemId}`, 404);
    }
  }

  const issueNumber = await generateIssueNumber(organizationId);

  return await MaterialIssue.create({
    organizationId,
    warehouseId: payload.warehouseId,
    issueNumber,
    productionOrderId: payload.productionOrderId,
    items: payload.items,
    status: 'DRAFT',
    createdBy: userId,
    remarks: payload.remarks,
  });
};

export const getMaterialIssues = async (organizationId, query = {}) => {
  const filter = { organizationId };

  if (query.warehouseId) filter.warehouseId = query.warehouseId;
  if (query.status) filter.status = query.status;
  if (query.search) {
    filter.issueNumber = { $regex: query.search, $options: 'i' };
  }

  return await MaterialIssue.find(filter)
    .populate('warehouseId', 'name code')
    .populate('items.itemId', 'name sku unit')
    .populate('items.batchId', 'batchNumber currentQuantity status') // 🆕 Populate batch info
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
};

export const getMaterialIssueById = async (organizationId, id) => {
  const issue = await MaterialIssue.findOne({ _id: id, organizationId })
    .populate('warehouseId', 'name code location')
    .populate('items.itemId', 'name sku unit itemType woodAttributes')
    .populate('items.batchId', 'batchNumber currentQuantity status') // 🆕 Populate batch info
    .populate('createdBy', 'name email');

  if (!issue) {
    throw new AppError('Material Issue record not found', 404);
  }

  return issue;
};

/**
 * Material Issue কনফার্ম করা এবং স্টক কমানো (Stock Engine decreaseStock hit করা with batchId)
 */
export const issueMaterial = async (organizationId, userId, id) => {
  const issue = await MaterialIssue.findOne({ _id: id, organizationId });

  if (!issue) {
    throw new AppError('Material Issue record not found', 404);
  }

  if (issue.status !== 'DRAFT') {
    throw new AppError(`Cannot process Material Issue with status '${issue.status}'`, 400);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    for (const item of issue.items) {
      await stockService.decreaseStock(
        {
          organizationId,
          warehouseId: issue.warehouseId,
          itemId: item.itemId,
          batchId: item.batchId, // 🆕 Pass batchId to decrease stock from specific batch
          quantity: item.quantity,
          referenceType: 'MATERIAL_ISSUE',
          referenceId: issue._id,
          performedBy: userId,
          remarks: `Material issued via MIN: ${issue.issueNumber}`,
        },
        session
      );
    }

    issue.status = 'ISSUED';
    issue.issuedAt = new Date();
    await issue.save({ session });

    await session.commitTransaction();
    session.endSession();

    return issue;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};