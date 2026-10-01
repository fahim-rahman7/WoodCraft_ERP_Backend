import { Stock } from './stock.model.js';
import { StockMovement } from '../stockMovement/stockMovement.model.js';
import { AppError } from '../../../utils/appError.js';

export const increaseStock = async (
  { organizationId, warehouseId, itemId, quantity, referenceType, referenceId, performedBy, remarks },
  session = null
) => {
  if (quantity <= 0) {
    throw new AppError('Quantity must be greater than zero', 400);
  }

  let stock = await Stock.findOne({ organizationId, warehouseId, itemId }).session(session);

  if (!stock) {
    stock = new Stock({
      organizationId,
      warehouseId,
      itemId,
      quantity: 0,
      reservedQuantity: 0,
      availableQuantity: 0,
    });
  }

  stock.quantity += quantity;
  stock.availableQuantity = stock.quantity - stock.reservedQuantity;
  await stock.save({ session });

  await StockMovement.create(
    [
      {
        organizationId,
        warehouseId,
        itemId,
        movementType: 'IN',
        referenceType,
        referenceId,
        quantity,
        balanceAfter: stock.quantity,
        performedBy,
        remarks,
      },
    ],
    { session }
  );

  return stock;
};

export const decreaseStock = async (
  { organizationId, warehouseId, itemId, quantity, referenceType, referenceId, performedBy, remarks },
  session = null
) => {
  if (quantity <= 0) {
    throw new AppError('Quantity must be greater than zero', 400);
  }

  const stock = await Stock.findOne({ organizationId, warehouseId, itemId }).session(session);

  if (!stock || stock.availableQuantity < quantity) {
    throw new AppError('Insufficient available stock for this operation', 400);
  }

  stock.quantity -= quantity;
  stock.availableQuantity = stock.quantity - stock.reservedQuantity;
  await stock.save({ session });

  await StockMovement.create(
    [
      {
        organizationId,
        warehouseId,
        itemId,
        movementType: 'OUT',
        referenceType,
        referenceId,
        quantity: -quantity,
        balanceAfter: stock.quantity,
        performedBy,
        remarks,
      },
    ],
    { session }
  );

  return stock;
};

export const reserveStock = async (
  { organizationId, warehouseId, itemId, quantity, referenceType, referenceId, performedBy, remarks },
  session = null
) => {
  if (quantity <= 0) {
    throw new AppError('Quantity must be greater than zero', 400);
  }

  const stock = await Stock.findOne({ organizationId, warehouseId, itemId }).session(session);

  if (!stock || stock.availableQuantity < quantity) {
    throw new AppError('Insufficient available stock to reserve', 400);
  }

  stock.reservedQuantity += quantity;
  stock.availableQuantity = stock.quantity - stock.reservedQuantity;
  await stock.save({ session });

  await StockMovement.create(
    [
      {
        organizationId,
        warehouseId,
        itemId,
        movementType: 'RESERVE',
        referenceType,
        referenceId,
        quantity,
        balanceAfter: stock.quantity,
        performedBy,
        remarks: remarks || 'Stock reserved for production',
      },
    ],
    { session }
  );

  return stock;
};

export const releaseReservedStock = async (
  { organizationId, warehouseId, itemId, quantity, referenceType, referenceId, performedBy, remarks },
  session = null
) => {
  if (quantity <= 0) {
    throw new AppError('Quantity must be greater than zero', 400);
  }

  const stock = await Stock.findOne({ organizationId, warehouseId, itemId }).session(session);

  if (!stock || stock.reservedQuantity < quantity) {
    throw new AppError('Cannot release more than reserved quantity', 400);
  }

  stock.reservedQuantity -= quantity;
  stock.availableQuantity = stock.quantity - stock.reservedQuantity;
  await stock.save({ session });

  await StockMovement.create(
    [
      {
        organizationId,
        warehouseId,
        itemId,
        movementType: 'RELEASE',
        referenceType,
        referenceId,
        quantity,
        balanceAfter: stock.quantity,
        performedBy,
        remarks: remarks || 'Reserved stock released',
      },
    ],
    { session }
  );

  return stock;
};

export const transferStock = async (
  { organizationId, fromWarehouseId, toWarehouseId, itemId, quantity, referenceId, performedBy, remarks },
  session = null
) => {
  if (fromWarehouseId.toString() === toWarehouseId.toString()) {
    throw new AppError('Source and destination warehouses cannot be the same', 400);
  }

  await decreaseStock(
    {
      organizationId,
      warehouseId: fromWarehouseId,
      itemId,
      quantity,
      referenceType: 'STOCK_TRANSFER',
      referenceId,
      performedBy,
      remarks: remarks || `Transferred to Warehouse ID: ${toWarehouseId}`,
    },
    session
  );

  await increaseStock(
    {
      organizationId,
      warehouseId: toWarehouseId,
      itemId,
      quantity,
      referenceType: 'STOCK_TRANSFER',
      referenceId,
      performedBy,
      remarks: remarks || `Transferred from Warehouse ID: ${fromWarehouseId}`,
    },
    session
  );

  return { success: true };
};

export const getStockSummary = async (organizationId, query = {}) => {
  const filter = { organizationId };

  if (query.warehouseId) filter.warehouseId = query.warehouseId;
  if (query.itemId) filter.itemId = query.itemId;

  return await Stock.find(filter)
    .populate('warehouseId', 'name code location')
    .populate('itemId', 'name sku unit itemType woodAttributes')
    .sort({ updatedAt: -1 });
};