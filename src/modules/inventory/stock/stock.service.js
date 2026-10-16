import { Stock } from './stock.model.js';
import { StockMovement } from '../stockMovement/stockMovement.model.js';
import { AppError } from '../../../utils/appError.js';

export const increaseStock = async (
  { organizationId, warehouseId, itemId, batchId, quantity, referenceType, referenceId, performedBy, remarks },
  session = null
) => {
  if (quantity <= 0) {
    throw new AppError('Quantity must be greater than zero', 400);
  }

  if (!batchId) {
    throw new AppError('Batch ID is required for stock increase', 400);
  }

  let stock = await Stock.findOne({ organizationId, warehouseId, itemId, batchId }).session(session);

  if (!stock) {
    stock = new Stock({
      organizationId,
      warehouseId,
      itemId,
      batchId,
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
        batchId, // Added batchId in movement
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
  { organizationId, warehouseId, itemId, batchId, quantity, referenceType, referenceId, performedBy, remarks },
  session = null
) => {
  if (quantity <= 0) {
    throw new AppError('Quantity must be greater than zero', 400);
  }

  if (!batchId) {
    throw new AppError('Batch ID is required for stock decrease', 400);
  }

  const stock = await Stock.findOne({ organizationId, warehouseId, itemId, batchId }).session(session);

  if (!stock || stock.availableQuantity < quantity) {
    throw new AppError('Insufficient available stock for this operation in the specified batch', 400);
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
        batchId, // 🆕 Added batchId
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
  { organizationId, warehouseId, itemId, batchId, quantity, referenceType, referenceId, performedBy, remarks },
  session = null
) => {
  if (quantity <= 0) {
    throw new AppError('Quantity must be greater than zero', 400);
  }

  if (!batchId) {
    throw new AppError('Batch ID is required to reserve stock', 400);
  }

  const stock = await Stock.findOne({ organizationId, warehouseId, itemId, batchId }).session(session);

  if (!stock || stock.availableQuantity < quantity) {
    throw new AppError('Insufficient available stock to reserve in the specified batch', 400);
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
        batchId, // Added batchId
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
  { organizationId, warehouseId, itemId, batchId, quantity, referenceType, referenceId, performedBy, remarks },
  session = null
) => {
  if (quantity <= 0) {
    throw new AppError('Quantity must be greater than zero', 400);
  }

  if (!batchId) {
    throw new AppError('Batch ID is required to release reserved stock', 400);
  }

  const stock = await Stock.findOne({ organizationId, warehouseId, itemId, batchId }).session(session);

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
        batchId, // Added batchId
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
  { organizationId, fromWarehouseId, toWarehouseId, itemId, batchId, quantity, referenceId, performedBy, remarks },
  session = null
) => {
  if (fromWarehouseId.toString() === toWarehouseId.toString()) {
    throw new AppError('Source and destination warehouses cannot be the same', 400);
  }

  if (!batchId) {
    throw new AppError('Batch ID is required for stock transfer', 400);
  }

  await decreaseStock(
    {
      organizationId,
      warehouseId: fromWarehouseId,
      itemId,
      batchId,
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
      batchId,
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
  if (query.batchId) filter.batchId = query.batchId; // 🆕 Filter by batchId if provided

  return await Stock.find(filter)
    .populate('warehouseId', 'name code location')
    .populate('itemId', 'name sku unit itemType woodAttributes')
    .populate('batchId', 'batchNumber manufactureDate receivedDate status') // 🆕 Populate batch details
    .sort({ updatedAt: -1 });
};