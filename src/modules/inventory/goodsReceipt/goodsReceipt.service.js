import mongoose from 'mongoose';
import { GoodsReceipt } from './goodsReceipt.model.js';
import { Warehouse } from '../warehouse/warehouse.model.js';
import { Item } from '../item/item.model.js';
import { Supplier } from '../supplier/supplier.model.js';
import { PurchaseOrder } from '../purchase/purchase.model.js';
import { Batch } from '../batch/batch.model.js'; // Batch model import
import * as stockService from '../stock/stock.service.js';
import { AppError } from '../../../utils/appError.js';

// GRN Number জেনারেট করার ফাংশন
const generateGRNNumber = async (organizationId) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await GoodsReceipt.countDocuments({ organizationId });
  const sequence = String(count + 1).padStart(4, '0');
  return `GRN-${dateStr}-${sequence}`;
};

export const createGoodsReceipt = async (organizationId, userId, payload) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ---- Supplier Check
    const supplierExist = await Supplier.findOne({
      _id: payload.supplierId,
      organizationId,
      status: 'ACTIVE',
    }).session(session);

    if (!supplierExist) {
      throw new AppError('Supplier not found or inactive', 404);
    }

    // ---- Supplier Invoice Check
    if (payload.supplierInvoiceNo) {
      const existingInvoice = await GoodsReceipt.findOne({
        organizationId,
        supplierId: payload.supplierId,
        supplierInvoiceNo: payload.supplierInvoiceNo,
      }).session(session);

      if (existingInvoice) {
        throw new AppError(
          `Goods Receipt with supplier invoice '${payload.supplierInvoiceNo}' already exists for this supplier`,
          400
        );
      }
    }

    // ---- Warehouse Check
    const warehouseExists = await Warehouse.findOne({
      _id: payload.warehouseId,
      organizationId,
    }).session(session);
    if (!warehouseExists) {
      throw new AppError('Warehouse not found', 404);
    }

    // ---- Purchase Order Check
    let purchaseOrder = null;
    if (payload.purchaseOrderId) {
      purchaseOrder = await PurchaseOrder.findOne({
        _id: payload.purchaseOrderId,
        organizationId,
      }).session(session);

      if (!purchaseOrder) {
        throw new AppError('Purchase Order not found', 404);
      }

      if (purchaseOrder.status !== 'APPROVED' && purchaseOrder.status !== 'PARTIALLY_RECEIVED') {
        throw new AppError(
          `Cannot create Goods Receipt for a Purchase Order with status '${purchaseOrder.status}'. Order must be APPROVED first.`,
          400
        );
      }
    }

    const grnNumber = await generateGRNNumber(organizationId);
    let totalAmount = 0;
    const processedItems = [];

    // ---- Items & Batch Processing within Transaction
    for (const item of payload.items) {
      const itemExists = await Item.findOne({
        _id: item.itemId,
        organizationId,
      }).session(session);
      if (!itemExists) {
        throw new AppError(`Item not found with ID: ${item.itemId}`, 404);
      }

      if (purchaseOrder) {
        const poItem = purchaseOrder.items.find(
          (i) => i.itemId.toString() === item.itemId.toString()
        );

        if (!poItem) {
          throw new AppError(`Item with ID ${item.itemId} does not exist in the referenced Purchase Order`, 400);
        }

        const remainingQty = poItem.orderedQuantity - (poItem.receivedQuantity || 0);
        if (item.quantity > remainingQty) {
          throw new AppError(
            `Received quantity (${item.quantity}) exceeds remaining ordered quantity (${remainingQty}) for item: ${itemExists.name}`,
            400
          );
        }
      }

      // Check if batch number already exists in this organization
      const existingBatch = await Batch.findOne({
        organizationId,
        batchNumber: item.batchNumber,
      }).session(session);

      if (existingBatch) {
        throw new AppError(`Batch number '${item.batchNumber}' already exists`, 400);
      }

      // 🆕 Create Batch record during GRN creation
      const [newBatch] = await Batch.create(
        [{
          organizationId,
          batchNumber: item.batchNumber,
          itemId: item.itemId,
          supplierId: payload.supplierId,
          warehouseId: payload.warehouseId,
          initialQuantity: item.quantity,
          currentQuantity: item.quantity,
          receivedDate: new Date(),
          status: 'ACTIVE',
        }],
        { session }
      );

      const itemTotalPrice = (item.unitPrice || 0) * item.quantity;
      totalAmount += itemTotalPrice;

      processedItems.push({
        itemId: item.itemId,
        batchId: newBatch._id,
        batchNumber: item.batchNumber,
        quantity: item.quantity,
        unitPrice: item.unitPrice || 0,
        totalPrice: itemTotalPrice,
      });
    }

    const goodsReceipt = await GoodsReceipt.create(
      [{
        organizationId,
        purchaseOrderId: payload.purchaseOrderId || undefined,
        warehouseId: payload.warehouseId,
        grnNumber,
        supplierId: payload.supplierId,
        supplierInvoiceNo: payload.supplierInvoiceNo,
        items: processedItems,
        totalAmount,
        status: 'DRAFT',
        createdBy: userId,
        remarks: payload.remarks,
      }],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return goodsReceipt[0];
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const getGoodsReceipts = async (organizationId, query = {}) => {
  const filter = { organizationId };

  if (query.warehouseId) filter.warehouseId = query.warehouseId;
  if (query.status) filter.status = query.status;
  if (query.search) {
    filter.$or = [{ grnNumber: { $regex: query.search, $options: 'i' } }];
  }

  return await GoodsReceipt.find(filter)
    .populate('supplierId', 'name phone email')
    .populate('warehouseId', 'name code')
    .populate('items.itemId', 'name sku unit')
    .populate('items.batchId', 'batchNumber currentQuantity') // Populate batch info
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
};

export const getGoodsReceiptById = async (organizationId, id) => {
  const goodsReceipt = await GoodsReceipt.findOne({ _id: id, organizationId })
    .populate('warehouseId', 'name code location')
    .populate('items.itemId', 'name sku unit itemType woodAttributes')
    .populate('items.batchId', 'batchNumber currentQuantity status') // Populate batch info
    .populate('createdBy', 'name email')
    .populate('supplierId', 'name phone email address');

  if (!goodsReceipt) {
    throw new AppError('Goods Receipt not found', 404);
  }

  return goodsReceipt;
};

/**
 * GRN স্ট্যাটাস RECEIVED করা এবং স্টক বাড়ানো (Batch সহ Stock Engine hit করা)
 */
export const receiveGoodsReceipt = async (organizationId, userId, id) => {
  const goodsReceipt = await GoodsReceipt.findOne({ _id: id, organizationId });

  if (!goodsReceipt) {
    throw new AppError('Goods Receipt not found', 404);
  }

  if (goodsReceipt.status !== 'DRAFT') {
    throw new AppError(`Cannot receive Goods Receipt with status '${goodsReceipt.status}'`, 400);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (goodsReceipt.purchaseOrderId) {
      const po = await PurchaseOrder.findById(goodsReceipt.purchaseOrderId).session(session);
      if (po) {
        for (const grnItem of goodsReceipt.items) {
          const poItem = po.items.find(i => i.itemId.toString() === grnItem.itemId.toString());
          if (poItem) {
            poItem.receivedQuantity = (poItem.receivedQuantity || 0) + grnItem.quantity;
          }
        }

        const isFullyReceived = po.items.every(i => i.receivedQuantity >= i.orderedQuantity);
        po.status = isFullyReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';
        await po.save({ session });
      }
    }

    // ---- Increase Stock with Batch ID
    for (const item of goodsReceipt.items) {
      await stockService.increaseStock(
        {
          organizationId,
          warehouseId: goodsReceipt.warehouseId,
          itemId: item.itemId,
          batchId: item.batchId, // স্টক সার্ভিসে ব্যাচ আইডি পাস করা হচ্ছে
          quantity: item.quantity,
          referenceType: 'GOODS_RECEIPT',
          referenceId: goodsReceipt._id,
          performedBy: userId,
          remarks: `Goods received via GRN: ${goodsReceipt.grnNumber}, Batch: ${item.batchNumber}`,
        },
        session
      );
    }

    goodsReceipt.status = 'RECEIVED';
    goodsReceipt.receivedAt = new Date();
    await goodsReceipt.save({ session });

    await session.commitTransaction();
    session.endSession();

    return goodsReceipt;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};