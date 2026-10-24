import { Supplier } from './supplier.model.js';
import { AppError } from '../../../utils/appError.js';

export const createSupplier = async (organizationId, payload) => {
  const existingSupplier = await Supplier.findOne({
    organizationId,
    name: { $regex: new RegExp(`^${payload.name}$`, 'i') },
  });

  if (existingSupplier) {
    throw new AppError('Supplier with this name already exists in this organization', 400);
  }

  const supplier = await Supplier.create({
    ...payload,
    organizationId,
  });

  return supplier;
};

export const getSuppliers = async (organizationId, query = {}) => {
  const filter = { organizationId };

  if (query.status) filter.status = query.status;
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { phone: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
    ];
  }

  return await Supplier.find(filter).sort({ createdAt: -1 });
};

export const getSupplierById = async (organizationId, supplierId) => {
  const supplier = await Supplier.findOne({
    _id: supplierId,
    organizationId,
  });

  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }

  return supplier;
};

export const updateSupplier = async (organizationId, supplierId, payload) => {
  if (payload.name) {
    const existingSupplier = await Supplier.findOne({
      organizationId,
      name: { $regex: new RegExp(`^${payload.name}$`, 'i') },
      _id: { $ne: supplierId },
    });

    if (existingSupplier) {
      throw new AppError('Supplier name already in use', 400);
    }
  }

  const supplier = await Supplier.findOneAndUpdate(
    { _id: supplierId, organizationId },
    payload,
    { new: true, runValidators: true }
  );

  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }

  return supplier;
};

export const deleteSupplier = async (organizationId, supplierId) => {
  const supplier = await Supplier.findOneAndDelete({
    _id: supplierId,
    organizationId,
  });

  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }

  return supplier;
};