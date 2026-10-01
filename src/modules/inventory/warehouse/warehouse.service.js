import { Warehouse } from './warehouse.model.js';
import { AppError } from '../../../utils/appError.js';

export const createWarehouse = async (organizationId, payload) => {
  const existingCode = await Warehouse.findOne({
    organizationId,
    code: payload.code,
  });

  if (existingCode) {
    throw new AppError('Warehouse code already exists in this organization', 400);
  }

  const warehouse = await Warehouse.create({
    ...payload,
    organizationId,
  });

  return warehouse;
};

export const getWarehouses = async (organizationId, query = {}) => {
  const filter = { organizationId };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { code: { $regex: query.search, $options: 'i' } },
    ];
  }

  return await Warehouse.find(filter).sort({ createdAt: -1 });
};

export const getWarehouseById = async (organizationId, warehouseId) => {
  const warehouse = await Warehouse.findOne({
    _id: warehouseId,
    organizationId,
  });

  if (!warehouse) {
    throw new AppError('Warehouse not found', 404);
  }

  return warehouse;
};

export const updateWarehouse = async (organizationId, warehouseId, payload) => {
  if (payload.code) {
    const existingCode = await Warehouse.findOne({
      organizationId,
      code: payload.code,
      _id: { $ne: warehouseId },
    });

    if (existingCode) {
      throw new AppError('Warehouse code already in use', 400);
    }
  }

  const warehouse = await Warehouse.findOneAndUpdate(
    { _id: warehouseId, organizationId },
    payload,
    { new: true, runValidators: true }
  );

  if (!warehouse) {
    throw new AppError('Warehouse not found', 404);
  }

  return warehouse;
};

export const deleteWarehouse = async (organizationId, warehouseId) => {
  const warehouse = await Warehouse.findOneAndDelete({
    _id: warehouseId,
    organizationId,
  });

  if (!warehouse) {
    throw new AppError('Warehouse not found', 404);
  }

  return warehouse;
};