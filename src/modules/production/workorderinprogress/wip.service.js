import mongoose from 'mongoose';
import { AppError } from '../../../utils/appError.js';
import { Wip } from './wip.model.js';
import { WorkOrder } from '../workOrder/workOrder.model.js';
import { ProductionOrder } from '../productionOrder/productionOrder.model.js';
import { Warehouse } from '../../inventory/warehouse/warehouse.model.js';

const ACTIVE_WIP_STATUSES = ['OPEN', 'IN_PROGRESS', 'ON_HOLD'];
const EDITABLE_WIP_STATUSES = ['IN_PROGRESS', 'ON_HOLD'];
const EPSILON = 1e-6;

const generateWipNumber = async (organizationId) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Wip.countDocuments({ organizationId });
  const sequence = String(count + 1).padStart(4, '0');
  return `WIP-${dateStr}-${sequence}`;
};

const appendRemarks = (existing, addition) => {
  if (!addition) return existing;
  return existing ? `${existing} | ${addition}` : addition;
};

const getWipOrFail = async (organizationId, id) => {
  const wip = await Wip.findOne({ _id: id, organizationId });
  if (!wip) throw new AppError('WIP record not found', 404);
  return wip;
};

const getWorkOrderOrFail = async (organizationId, workOrderId) => {
  const workOrder = await WorkOrder.findOne({ _id: workOrderId, organizationId });
  if (!workOrder) throw new AppError('Work Order not found', 404);
  return workOrder;
};

const getProductionOrderOrFail = async (organizationId, productionOrderId) => {
  const productionOrder = await ProductionOrder.findOne({
    _id: productionOrderId,
    organizationId,
  });
  if (!productionOrder) throw new AppError('Linked Production Order not found', 404);
  return productionOrder;
};

/**
 * Work Order-এর completedQuantity ধাপে ধাপে Sync করা হয় WIP progress-এর সাথে।
 * Conditional pipeline update ব্যবহার করা হয়েছে যাতে concurrent update-এ
 * target quantity কখনোও overshoot না করে।
 */
const syncWorkOrderProgress = async (organizationId, workOrder, completedDelta) => {
  if (!completedDelta || completedDelta <= 0) return;

  const maxAllowed = Number((workOrder.targetQuantity - completedDelta).toFixed(3));

  const updatedWorkOrder = await WorkOrder.findOneAndUpdate(
    {
      _id: workOrder._id,
      organizationId,
      status: { $in: ['PENDING', 'IN_PROGRESS'] },
      completedQuantity: { $lte: maxAllowed },
    },
    [
      { $set: { completedQuantity: { $add: ['$completedQuantity', completedDelta] } } },
      {
        $set: {
          status: {
            $cond: [
              { $gte: ['$completedQuantity', '$targetQuantity'] },
              'COMPLETED',
              '$status',
            ],
          },
          endDate: {
            $cond: [{ $gte: ['$completedQuantity', '$targetQuantity'] }, '$$NOW', '$endDate'],
          },
        },
      },
    ],
    { new: true }
  );

  if (!updatedWorkOrder) {
    throw new AppError(
      `Cannot record ${completedDelta} completed unit(s): Work Order '${workOrder.workOrderNumber}' target quantity (${workOrder.targetQuantity}) would be exceeded`,
      409
    );
  }

  return updatedWorkOrder;
};

export const createWip = async (organizationId, userId, payload) => {
  // 1. Work Order validate
  const workOrder = await getWorkOrderOrFail(organizationId, payload.workOrderId);

  if (workOrder.status !== 'IN_PROGRESS') {
    throw new AppError(
      `Cannot create a WIP record for a '${workOrder.status}' Work Order. Please start the work order first.`,
      400
    );
  }

  // 2. Linked Production Order validate
  const productionOrder = await getProductionOrderOrFail(
    organizationId,
    workOrder.productionOrderId
  );

  if (productionOrder.status !== 'IN_PRODUCTION') {
    throw new AppError(
      `Cannot create WIP for a '${productionOrder.status}' Production Order`,
      400
    );
  }

  // 3. Warehouse validate (না দিলে Production Order-এর warehouse inherit হবে)
  const warehouseId = payload.warehouseId || productionOrder.warehouseId;
  const warehouse = await Warehouse.findOne({
    _id: warehouseId,
    organizationId,
    status: 'ACTIVE',
  });
  if (!warehouse) {
    throw new AppError('Warehouse not found or inactive', 404);
  }

  // 4. একই Work Order-এ আগে থেকে allocated WIP quantity বের করা
  const existingWips = await Wip.find({
    organizationId,
    workOrderId: workOrder._id,
    status: { $ne: 'CANCELLED' },
  }).select('quantityIn');

  const alreadyAllocated = existingWips.reduce((sum, wip) => sum + wip.quantityIn, 0);
  const totalAllocated = Number((alreadyAllocated + payload.quantityIn).toFixed(3));

  if (totalAllocated > workOrder.targetQuantity) {
    throw new AppError(
      `Total WIP quantity (${totalAllocated}) cannot exceed Work Order target quantity (${workOrder.targetQuantity}). Already allocated: ${alreadyAllocated}`,
      400
    );
  }

  // 5. Create
  const wipNumber = await generateWipNumber(organizationId);

  return await Wip.create({
    organizationId,
    wipNumber,
    workOrderId: workOrder._id,
    productionOrderId: workOrder.productionOrderId,
    operationName: workOrder.operationName,
    sequence: workOrder.sequence || 1,
    warehouseId,
    status: 'OPEN',
    quantityIn: payload.quantityIn,
    materialCost: payload.materialCost || 0,
    labourCost: payload.labourCost || 0,
    overheadCost: payload.overheadCost || 0,
    assignedTo: payload.assignedTo,
    dueDate: payload.dueDate,
    remarks: payload.remarks,
    createdBy: userId,
  });
};

export const getWips = async (organizationId, query = {}) => {
  const filter = { organizationId };

  if (query.status) filter.status = query.status;
  if (query.workOrderId) filter.workOrderId = query.workOrderId;
  if (query.productionOrderId) filter.productionOrderId = query.productionOrderId;
  if (query.warehouseId) filter.warehouseId = query.warehouseId;
  if (query.assignedTo) filter.assignedTo = query.assignedTo;

  if (query.search) {
    filter.$or = [
      { wipNumber: { $regex: query.search, $options: 'i' } },
      { operationName: { $regex: query.search, $options: 'i' } },
    ];
  }

  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }

  return await Wip.find(filter)
    .populate('workOrderId', 'workOrderNumber operationName targetQuantity completedQuantity status')
    .populate('productionOrderId', 'orderNumber targetQuantity status targetItemId')
    .populate('warehouseId', 'name code')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
};

export const getWipById = async (organizationId, id) => {
  const wip = await Wip.findOne({ _id: id, organizationId })
    .populate(
      'workOrderId',
      'workOrderNumber operationName sequence targetQuantity completedQuantity status assignedTo startDate endDate'
    )
    .populate('productionOrderId', 'orderNumber targetQuantity status targetItemId bomId warehouseId')
    .populate('warehouseId', 'name code location')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .populate('progressLogs.loggedBy', 'name email');

  if (!wip) throw new AppError('WIP record not found', 404);
  return wip;
};

export const startWip = async (organizationId, id) => {
  const wip = await getWipOrFail(organizationId, id);

  if (wip.status !== 'OPEN') {
    throw new AppError(`Cannot start WIP record with status '${wip.status}'`, 400);
  }

  wip.status = 'IN_PROGRESS';
  wip.startedAt = new Date();
  await wip.save();

  return wip;
};

export const updateWipProgress = async (organizationId, userId, id, payload) => {
  const wip = await getWipOrFail(organizationId, id);

  if (wip.status !== 'IN_PROGRESS') {
    throw new AppError(
      wip.status === 'OPEN'
        ? 'Please start the WIP record before updating progress'
        : `Cannot update progress for a '${wip.status}' WIP record`,
      400
    );
  }

  const completedDelta = payload.quantityCompleted;
  const scrapDelta = payload.quantityScrapped || 0;
  const materialDelta = payload.materialCost || 0;
  const labourDelta = payload.labourCost || 0;
  const overheadDelta = payload.overheadCost || 0;

  const newCompleted = Number((wip.quantityCompleted + completedDelta).toFixed(3));
  const newScrapped = Number((wip.quantityScrapped + scrapDelta).toFixed(3));

  if (newCompleted + newScrapped - wip.quantityIn > EPSILON) {
    throw new AppError(
      `Total accounted quantity (${newCompleted + newScrapped}) cannot exceed quantity in process (${wip.quantityIn}). Available balance: ${wip.quantityBalance}`,
      400
    );
  }

  const workOrder = await getWorkOrderOrFail(organizationId, wip.workOrderId);
  if (workOrder.completedQuantity + completedDelta - workOrder.targetQuantity > EPSILON) {
    throw new AppError(
      `Completed quantity (${workOrder.completedQuantity + completedDelta}) cannot exceed Work Order target quantity (${workOrder.targetQuantity}). Already completed: ${workOrder.completedQuantity}`,
      400
    );
  }

  // Snapshot for rollback in case Work Order sync fails
  const previousState = {
    quantityCompleted: wip.quantityCompleted,
    quantityScrapped: wip.quantityScrapped,
    materialCost: wip.materialCost,
    labourCost: wip.labourCost,
    overheadCost: wip.overheadCost,
  };

  wip.quantityCompleted = newCompleted;
  wip.quantityScrapped = newScrapped;
  wip.materialCost += materialDelta;
  wip.labourCost += labourDelta;
  wip.overheadCost += overheadDelta;

  wip.progressLogs.push({
    quantityCompleted: completedDelta,
    quantityScrapped: scrapDelta,
    materialCost: materialDelta,
    labourCost: labourDelta,
    overheadCost: overheadDelta,
    remarks: payload.remarks,
    loggedBy: userId,
    loggedAt: new Date(),
  });

  await wip.save();

  try {
    await syncWorkOrderProgress(organizationId, workOrder, completedDelta);
  } catch (error) {
    // Work Order sync fail করলে WIP ডকুমেন্টটি আগের অবস্থায় ফিরিয়ে দেওয়া হয়
    wip.quantityCompleted = previousState.quantityCompleted;
    wip.quantityScrapped = previousState.quantityScrapped;
    wip.materialCost = previousState.materialCost;
    wip.labourCost = previousState.labourCost;
    wip.overheadCost = previousState.overheadCost;
    wip.progressLogs.pop();

    try {
      await wip.save();
    } catch (rollbackError) {
      console.error(
        `Failed to rollback WIP ${wip.wipNumber} after Work Order sync failure:`,
        rollbackError.message
      );
    }

    throw error;
  }

  return wip;
};

export const scrapWip = async (organizationId, userId, id, payload) => {
  const wip = await getWipOrFail(organizationId, id);

  if (!EDITABLE_WIP_STATUSES.includes(wip.status)) {
    throw new AppError(`Cannot record scrap for a '${wip.status}' WIP record`, 400);
  }

  const scrapQuantity = payload.quantity;
  const newScrapped = Number((wip.quantityScrapped + scrapQuantity).toFixed(3));

  if (wip.quantityCompleted + newScrapped - wip.quantityIn > EPSILON) {
    throw new AppError(
      `Scrap quantity (${scrapQuantity}) exceeds the available balance (${wip.quantityBalance})`,
      400
    );
  }

  wip.quantityScrapped = newScrapped;
  wip.materialCost += payload.materialCost || 0;
  wip.labourCost += payload.labourCost || 0;
  wip.overheadCost += payload.overheadCost || 0;

  wip.progressLogs.push({
    quantityCompleted: 0,
    quantityScrapped: scrapQuantity,
    materialCost: payload.materialCost || 0,
    labourCost: payload.labourCost || 0,
    overheadCost: payload.overheadCost || 0,
    remarks: payload.remarks
      ? `Scrap: ${payload.remarks}`
      : 'Scrap recorded',
    loggedBy: userId,
    loggedAt: new Date(),
  });

  await wip.save();
  return wip;
};

export const holdWip = async (organizationId, id, payload = {}) => {
  const wip = await getWipOrFail(organizationId, id);

  if (wip.status !== 'IN_PROGRESS') {
    throw new AppError(`Cannot put a '${wip.status}' WIP record on hold`, 400);
  }

  wip.status = 'ON_HOLD';
  wip.remarks = appendRemarks(wip.remarks, payload.remarks);
  await wip.save();

  return wip;
};

export const resumeWip = async (organizationId, id, payload = {}) => {
  const wip = await getWipOrFail(organizationId, id);

  if (wip.status !== 'ON_HOLD') {
    throw new AppError(`Cannot resume a '${wip.status}' WIP record`, 400);
  }

  wip.status = 'IN_PROGRESS';
  wip.remarks = appendRemarks(wip.remarks, payload.remarks);
  await wip.save();

  return wip;
};

export const completeWip = async (organizationId, id, payload = {}) => {
  const wip = await getWipOrFail(organizationId, id);

  if (wip.status === 'COMPLETED') {
    throw new AppError('WIP record is already completed', 400);
  }

  if (!EDITABLE_WIP_STATUSES.includes(wip.status)) {
    throw new AppError(`Cannot complete a '${wip.status}' WIP record`, 400);
  }

  const balance = Number(
    (wip.quantityIn - wip.quantityCompleted - wip.quantityScrapped).toFixed(3)
  );

  if (balance > EPSILON) {
    throw new AppError(
      `Cannot complete WIP: ${balance} unit(s) are still unaccounted. Record the remaining output or scrap first.`,
      400
    );
  }

  wip.status = 'COMPLETED';
  wip.completedAt = new Date();
  wip.remarks = appendRemarks(wip.remarks, payload.remarks);
  await wip.save();

  return wip;
};

export const cancelWip = async (organizationId, id, payload = {}) => {
  const wip = await getWipOrFail(organizationId, id);

  if (!ACTIVE_WIP_STATUSES.includes(wip.status)) {
    throw new AppError(`Cannot cancel a '${wip.status}' WIP record`, 400);
  }

  wip.status = 'CANCELLED';
  wip.cancelledAt = new Date();
  wip.remarks = appendRemarks(wip.remarks, payload.remarks);
  await wip.save();

  return wip;
};

export const getWipSummary = async (organizationId, query = {}) => {
  const match = { organizationId: new mongoose.Types.ObjectId(organizationId) };

  if (query.status) match.status = query.status;
  if (query.workOrderId) {
    match.workOrderId = new mongoose.Types.ObjectId(query.workOrderId);
  }
  if (query.productionOrderId) {
    match.productionOrderId = new mongoose.Types.ObjectId(query.productionOrderId);
  }
  if (query.warehouseId) {
    match.warehouseId = new mongoose.Types.ObjectId(query.warehouseId);
  }

  const grouped = await Wip.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        records: { $sum: 1 },
        quantityIn: { $sum: '$quantityIn' },
        quantityCompleted: { $sum: '$quantityCompleted' },
        quantityScrapped: { $sum: '$quantityScrapped' },
        materialCost: { $sum: '$materialCost' },
        labourCost: { $sum: '$labourCost' },
        overheadCost: { $sum: '$overheadCost' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const round = (value) => Number((value || 0).toFixed(2));

  const byStatus = grouped.map((group) => ({
    status: group._id,
    records: group.records,
    quantityIn: round(group.quantityIn),
    quantityCompleted: round(group.quantityCompleted),
    quantityScrapped: round(group.quantityScrapped),
    quantityBalance: round(
      group.quantityIn - group.quantityCompleted - group.quantityScrapped
    ),
    materialCost: round(group.materialCost),
    labourCost: round(group.labourCost),
    overheadCost: round(group.overheadCost),
    totalWipValue: round(group.materialCost + group.labourCost + group.overheadCost),
  }));

  const totals = byStatus.reduce(
    (acc, item) => {
      acc.records += item.records;
      acc.quantityIn += item.quantityIn;
      acc.quantityCompleted += item.quantityCompleted;
      acc.quantityScrapped += item.quantityScrapped;
      acc.quantityBalance += item.quantityBalance;
      acc.materialCost += item.materialCost;
      acc.labourCost += item.labourCost;
      acc.overheadCost += item.overheadCost;
      acc.totalWipValue += item.totalWipValue;
      return acc;
    },
    {
      records: 0,
      quantityIn: 0,
      quantityCompleted: 0,
      quantityScrapped: 0,
      quantityBalance: 0,
      materialCost: 0,
      labourCost: 0,
      overheadCost: 0,
      totalWipValue: 0,
    }
  );

  return { byStatus, totals };
};
