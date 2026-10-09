import mongoose from 'mongoose';
import { GoodsReceipt } from './goodsReceipt.model.js';
import { Warehouse } from '../warehouse/warehouse.model.js';
import { Item } from '../item/item.model.js';
import * as stockService from '../stock/stock.service.js';
import { AppError } from '../../../utils/appError.js';

// GRN Number জেনারেট করার ফাংশন (যেমন: GRN-20261003-0001)
const generateGRNNumber = async (organizationId) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await GoodsReceipt.countDocuments({ organizationId });
  const sequence = String(count + 1).padStart(4, '0');
  return `GRN-${dateStr}-${sequence}`;
};

export const createGoodsReceipt = async (organizationId, userId, payload) => {
  // ১. ওয়ারহাউজ চেক করা
  const warehouseExists = await Warehouse.findOne({
    _id: payload.warehouseId,
    organizationId,
  });
  if (!warehouseExists) {
    throw new AppError('Warehouse not found', 404);
  }

  // ২. প্রতিটি আইটেম চেক করা এবং টোটাল হিসেব করা
  let totalAmount = 0;
  const processedItems = [];

  for (const item of payload.items) {
    const itemExists = await Item.findOne({ _id: item.itemId, organizationId });
    if (!itemExists) {
      throw new AppError(`Item not found with ID: ${item.itemId}`, 404);
    }

    const itemTotalPrice = (item.unitPrice || 0) * item.quantity;
    totalAmount += itemTotalPrice;

    processedItems.push({
      itemId: item.itemId,
      quantity: item.quantity,
      unitPrice: item.unitPrice || 0,
      totalPrice: itemTotalPrice,
    });
  }

  const grnNumber = await generateGRNNumber(organizationId);

  const goodsReceipt = await GoodsReceipt.create({
    organizationId,
    warehouseId: payload.warehouseId,
    grnNumber,
    supplierName: payload.supplierName,
    supplierInvoiceNo: payload.supplierInvoiceNo,
    items: processedItems,
    totalAmount,
    status: 'DRAFT',
    createdBy: userId,
    remarks: payload.remarks,
  });

  return goodsReceipt;
};

export const getGoodsReceipts = async (organizationId, query = {}) => {
  const filter = { organizationId };

  if (query.warehouseId) filter.warehouseId = query.warehouseId;
  if (query.status) filter.status = query.status;
  if (query.search) {
    filter.$or = [
      { grnNumber: { $regex: query.search, $options: 'i' } },
      { supplierName: { $regex: query.search, $options: 'i' } },
    ];
  }

  return await GoodsReceipt.find(filter)
    .populate('warehouseId', 'name code')
    .populate('items.itemId', 'name sku unit')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
};

export const getGoodsReceiptById = async (organizationId, id) => {
  const goodsReceipt = await GoodsReceipt.findOne({ _id: id, organizationId })
    .populate('warehouseId', 'name code location')
    .populate('items.itemId', 'name sku unit itemType woodAttributes')
    .populate('createdBy', 'name email');

  if (!goodsReceipt) {
    throw new AppError('Goods Receipt not found', 404);
  }

  return goodsReceipt;
};

/**
 * GRN স্ট্যাটাস RECEIVED করা এবং স্টক বাড়ানো (Stock Engine hit করা)
 */
export const receiveGoodsReceipt = async (organizationId, userId, id) => {
  const goodsReceipt = await GoodsReceipt.findOne({ _id: id, organizationId });

  if (!goodsReceipt) {
    throw new AppError('Goods Receipt not found', 404);
  }

  if (goodsReceipt.status !== 'DRAFT') {
    throw new AppError(`Cannot receive Goods Receipt with status '${goodsReceipt.status}'`, 400);
  }

  // Database Transaction শুরু
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // প্রতিটা আইটেমের জন্য Core Stock Engine-এ কল করা
    for (const item of goodsReceipt.items) {
      await stockService.increaseStock(
        {
          organizationId,
          warehouseId: goodsReceipt.warehouseId,
          itemId: item.itemId,
          quantity: item.quantity,
          referenceType: 'GOODS_RECEIPT',
          referenceId: goodsReceipt._id,
          performedBy: userId,
          remarks: `Goods received via GRN: ${goodsReceipt.grnNumber}`,
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