import { Batch } from './batch.model.js';
import { Item } from '../item/item.model.js';
import { Supplier } from '../supplier/supplier.model.js';
import { Warehouse } from '../warehouse/warehouse.model.js';
import { AppError } from '../../../errors/AppError.js';

export const createBatch = async (organizationId, payload) => {
  const item = await Item.findOne({ _id: payload.itemId, organizationId, status: 'ACTIVE' });
  if (!item) throw new AppError('Item not found or inactive', 404);

  const supplier = await Supplier.findOne({ _id: payload.supplierId, organizationId, status: 'ACTIVE' });
  if (!supplier) throw new AppError('Supplier not found or inactive', 404);

  const warehouse = await Warehouse.findOne({ _id: payload.warehouseId, organizationId, status: 'ACTIVE' });
  if (!warehouse) throw new AppError('Warehouse not found or inactive', 404);

  const existingBatch = await Batch.findOne({ organizationId, batchNumber: payload.batchNumber });
  if (existingBatch) throw new AppError('Batch number already exists', 400);

  const batch = await Batch.create({
    organizationId,
    batchNumber: payload.batchNumber,
    itemId: payload.itemId,
    supplierId: payload.supplierId,
    warehouseId: payload.warehouseId,
    initialQuantity: payload.initialQuantity,
    currentQuantity: payload.initialQuantity,
    manufactureDate: payload.manufactureDate,
    receivedDate: payload.receivedDate || new Date(),
    remarks: payload.remarks,
    status: 'ACTIVE',
  });

  return batch;
};

export const getAllBatches = async (organizationId, query = {}) => {
  const filter = { organizationId, ...query };
  const batches = await Batch.find(filter)
    .populate('itemId', 'name sku unit')
    .populate('supplierId', 'name phone')
    .populate('warehouseId', 'name code');
  return batches;
};

export const getBatchById = async (organizationId, batchId) => {
  const batch = await Batch.findOne({ _id: batchId, organizationId })
    .populate('itemId', 'name sku unit')
    .populate('supplierId', 'name phone')
    .populate('warehouseId', 'name code');
  if (!batch) throw new AppError('Batch not found', 404);
  return batch;
};

export const updateBatch = async (organizationId, batchId, payload) => {
  const batch = await Batch.findOne({ _id: batchId, organizationId });
  if (!batch) throw new AppError('Batch not found', 404);

  if (payload.batchNumber && payload.batchNumber !== batch.batchNumber) {
    const existingBatch = await Batch.findOne({ organizationId, batchNumber: payload.batchNumber });
    if (existingBatch) throw new AppError('Batch number already exists', 400);
  }

  Object.assign(batch, payload);
  await batch.save();

  return batch;
};

export const deleteBatch = async (organizationId, batchId) => {
  const batch = await Batch.findOne({ _id: batchId, organizationId });
  if (!batch) throw new AppError('Batch not found', 404);

  // যদি ব্যাচে স্টক থেকে থাকে, তবে ডিলিট করা রোধ করার প্রটেকশন দিতে পারো
  if (batch.currentQuantity > 0) {
    throw new AppError('Cannot delete batch with existing stock quantity. Please exhaust or adjust stock first.', 400);
  }

  await Batch.deleteOne({ _id: batchId, organizationId });
  return { message: 'Batch deleted successfully' };
};