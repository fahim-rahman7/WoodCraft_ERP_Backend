import { StockMovement } from './stockMovement.model.js';

export const getStockMovements = async (organizationId, query = {}) => {
  const filter = { organizationId };

  if (query.warehouseId) filter.warehouseId = query.warehouseId;
  if (query.itemId) filter.itemId = query.itemId;
  if (query.movementType) filter.movementType = query.movementType;
  if (query.referenceType) filter.referenceType = query.referenceType;

  return await StockMovement.find(filter)
    .populate('warehouseId', 'name code')
    .populate('itemId', 'name sku unit')
    .populate('performedBy', 'name email')
    .sort({ createdAt: -1 });
};