import { Item } from './item.model.js';
import { AppError } from '../../../utils/appError.js';

export const createItem = async (organizationId, payload) => {
  const existingSku = await Item.findOne({
    organizationId,
    sku: payload.sku,
  });

  if (existingSku) {
    throw new AppError('Item SKU already exists in this organization', 400);
  }

  const item = await Item.create({
    ...payload,
    organizationId,
  });

  return item;
};

export const getItems = async (organizationId, query = {}) => {
  const filter = { organizationId };

  if (query.categoryId) filter.categoryId = query.categoryId;
  if (query.itemType) filter.itemType = query.itemType;
  if (query.status) filter.status = query.status;

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { sku: { $regex: query.search, $options: 'i' } },
    ];
  }

  return await Item.find(filter)
    .populate('categoryId', 'name code')
    .sort({ createdAt: -1 });
};

export const getItemById = async (organizationId, itemId) => {
  const item = await Item.findOne({
    _id: itemId,
    organizationId,
  }).populate('categoryId', 'name code');

  if (!item) {
    throw new AppError('Item not found', 404);
  }

  return item;
};

export const updateItem = async (organizationId, itemId, payload) => {
  if (payload.sku) {
    const existingSku = await Item.findOne({
      organizationId,
      sku: payload.sku,
      _id: { $ne: itemId },
    });

    if (existingSku) {
      throw new AppError('Item SKU already in use', 400);
    }
  }

  const item = await Item.findOneAndUpdate(
    { _id: itemId, organizationId },
    payload,
    { new: true, runValidators: true }
  ).populate('categoryId', 'name code');

  if (!item) {
    throw new AppError('Item not found', 404);
  }

  return item;
};

export const deleteItem = async (organizationId, itemId) => {
  const item = await Item.findOneAndDelete({
    _id: itemId,
    organizationId,
  });

  if (!item) {
    throw new AppError('Item not found', 404);
  }

  return item;
};