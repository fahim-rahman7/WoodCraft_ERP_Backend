import mongoose from 'mongoose';
import { MaterialIssue } from './materialIssue.model.js';
import { Warehouse } from '../../inventory/warehouse/warehouse.model.js';
import { Item } from '../../inventory/item/item.model.js';
import * as stockService from '../../inventory/stock/stock.service.js'; //  Inventory Module থেকে Stock Engine Import
import { AppError } from '../../../utils/appError.js';

const generateIssueNumber = async (organizationId) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await MaterialIssue.countDocuments({ organizationId });
  const sequence = String(count + 1).padStart(4, '0');
  return `MIN-${dateStr}-${sequence}`;
};

export const createMaterialIssue = async (organizationId, userId, payload) => {
  const warehouseExists = await Warehouse.findOne({
    _id: payload.warehouseId,
    organizationId,
  });
  if (!warehouseExists) {
    throw new AppError('Warehouse not found', 404);
  }

  for (const item of payload.items) {
    const itemExists = await Item.findOne({ _id: item.itemId, organizationId });
    if (!itemExists) {
      throw new AppError(`Item not found with ID: ${item.itemId}`, 404);
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
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
};

export const getMaterialIssueById = async (organizationId, id) => {
  const issue = await MaterialIssue.findOne({ _id: id, organizationId })
    .populate('warehouseId', 'name code location')
    .populate('items.itemId', 'name sku unit itemType woodAttributes')
    .populate('createdBy', 'name email');

  if (!issue) {
    throw new AppError('Material Issue record not found', 404);
  }

  return issue;
};

/**
 * Material Issue কনফার্ম করা এবং স্টক কমানো (Stock Engine decreaseStock hit করা)
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