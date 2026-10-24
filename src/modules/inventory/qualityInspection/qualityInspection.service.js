import mongoose from 'mongoose';
import {
  QualityInspection
} from './qualityInspection.model.js';
import {
  GoodsReceipt
} from '../goodsReceipt/goodsReceipt.model.js';
import {
  Supplier
} from '../../procurement/supplier/supplier.model.js';
import {
  Warehouse
} from '../warehouse/warehouse.model.js';
import {
  Item
} from '../item/item.model.js';
import {
  increaseStock
} from '../stock/stock.service.js';
import {
  AppError
} from '../../../utils/appError.js';

const generateInspectionNumber = async (organizationId) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await QualityInspection.countDocuments({
    organizationId
  });
  const sequence = String(count + 1).padStart(4, '0');
  return `QI-${dateStr}-${sequence}`;
};

export const createQualityInspection = async (organizationId, userId, payload) => {
  // ১. Goods Receipt চেক করা
  const grn = await GoodsReceipt.findOne({
    _id: payload.goodsReceiptId,
    organizationId,
  });
  if (!grn) {
    throw new AppError('Goods Receipt not found', 404);
  }

  if (grn.status !== 'DRAFT' && grn.status !== 'RECEIVED') {
    throw new AppError(`Cannot create Quality Inspection for a Goods Receipt with status '${grn.status}'`, 400);
  }

  // ২. Supplier ও Warehouse চেক করা
  const supplierExist = await Supplier.findOne({
    _id: payload.supplierId,
    organizationId,
    status: 'ACTIVE'
  });
  if (!supplierExist) throw new AppError('Supplier not found or inactive', 404);

  const warehouseExist = await Warehouse.findOne({
    _id: payload.warehouseId,
    organizationId,
    status: 'ACTIVE'
  });
  if (!warehouseExist) throw new AppError('Warehouse not found or inactive', 404);

  // Warehouse Mismatch Validation (GRN warehouse === QI warehouse)
  if (payload.warehouseId.toString() !== grn.warehouseId.toString()) {
    throw new AppError('Quality Inspection warehouse must match the Goods Receipt warehouse', 400);
  }

  // এই GRN এর বিপরীতে ইতিপূর্বে তৈরি হওয়া সকল Active Quality Inspection খুঁজে বের করা
  const existingQIs = await QualityInspection.find({
    goodsReceiptId: payload.goodsReceiptId,
    organizationId,
    status: {
      $ne: 'CANCELLED'
    },
  });

  // প্রতিটি আইটেম ভ্যালিডেশন এবং Accumulated Quantity চেক করা
  const processedItems = [];
  for (const item of payload.items) {
    const itemExist = await Item.findOne({
      _id: item.itemId,
      organizationId,
      status: 'ACTIVE'
    });
    if (!itemExist) throw new AppError(`Item not found: ${item.itemId}`, 404);

    const grnItem = grn.items.find((i) => i.itemId.toString() === item.itemId.toString());
    if (!grnItem) {
      throw new AppError(`Item with ID ${item.itemId} does not exist in the referenced Goods Receipt`, 400);
    }

    // এই আইটেমের বিপরীতে ইতিপূর্বে কতটুকু কোয়ান্টিটি ইন্সপেক্ট করা হয়েছে তার যোগফল বের করা
    const previousInspectedQty = existingQIs.reduce((sum, qi) => {
      const found = qi.items.find((i) => i.itemId.toString() === item.itemId.toString());
      return sum + (found ? found.receivedQuantity : 0);
    }, 0);

    const totalInspectedQty = previousInspectedQty + item.receivedQuantity;

    // মোট ইন্সপেক্টেড পরিমাণ GRN-এর পরিমাণকে ছাড়িয়ে যেতে পারবে না
    if (totalInspectedQty > grnItem.quantity) {
      throw new AppError(
        `Total inspected quantity (${totalInspectedQty}) exceeds GRN quantity (${grnItem.quantity}) for item ID ${item.itemId}. Already inspected: ${previousInspectedQty}`,
        400
      );
    }

    processedItems.push({
      itemId: item.itemId,
      batchId: grnItem.batchId, // 🆕 Grabbing batchId from the corresponding GRN item
      receivedQuantity: item.receivedQuantity,
      acceptedQuantity: item.acceptedQuantity,
      rejectedQuantity: item.rejectedQuantity,
      inspectionResult: item.inspectionResult || 'PASS',
      remarks: item.remarks,
    });
  }

  const inspectionNumber = await generateInspectionNumber(organizationId);

  const qualityInspection = await QualityInspection.create({
    organizationId,
    inspectionNumber,
    goodsReceiptId: payload.goodsReceiptId,
    supplierId: payload.supplierId,
    warehouseId: payload.warehouseId,
    inspectionDate: payload.inspectionDate || new Date(),
    items: processedItems,
    inspectedBy: userId,
    remarks: payload.remarks,
    status: 'PENDING',
  });

  return qualityInspection;
};

export const getQualityInspections = async (organizationId, query = {}) => {
  const filter = {
    organizationId
  };
  if (query.status) filter.status = query.status;
  if (query.supplierId) filter.supplierId = query.supplierId;
  if (query.warehouseId) filter.warehouseId = query.warehouseId;
  if (query.search) {
    filter.$or = [{
      inspectionNumber: {
        $regex: query.search,
        $options: 'i'
      }
    }];
  }

  return await QualityInspection.find(filter)
    .populate('supplierId', 'name phone email')
    .populate('warehouseId', 'name code')
    .populate('goodsReceiptId', 'grnNumber')
    .populate('items.itemId', 'name sku unit')
    .populate('items.batchId', 'batchNumber status') // 🆕 Populate batch info
    .populate('inspectedBy', 'name email')
    .sort({
      createdAt: -1
    });
};

export const getQualityInspectionById = async (organizationId, id) => {
  const qi = await QualityInspection.findOne({
      _id: id,
      organizationId
    })
    .populate('supplierId', 'name phone email address')
    .populate('warehouseId', 'name code location')
    .populate('goodsReceiptId', 'grnNumber status')
    .populate('items.itemId', 'name sku unit itemType woodAttributes')
    .populate('items.batchId', 'batchNumber currentQuantity status') // 🆕 Populate batch info
    .populate('inspectedBy', 'name email');

  if (!qi) {
    throw new AppError('Quality Inspection not found', 404);
  }
  return qi;
};

export const inspectQualityInspection = async (organizationId, userId, id) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const qi = await QualityInspection.findOne({
      _id: id,
      organizationId
    }).session(session);
    if (!qi) {
      throw new AppError('Quality Inspection not found', 404);
    }

    if (qi.status !== 'PENDING') {
      throw new AppError(`Cannot inspect Quality Inspection with status '${qi.status}'`, 400);
    }

    // ১. প্রতিটা আইটেমের acceptedQuantity সেন্ট্রাল স্টক সার্ভিসের মাধ্যমে নির্দিষ্ট ব্যাচে স্টকে যোগ করা
    for (const item of qi.items) {
      if (item.acceptedQuantity > 0) {
        await increaseStock({
            organizationId,
            warehouseId: qi.warehouseId,
            itemId: item.itemId,
            batchId: item.batchId, // 🆕 Pass batchId to increase stock in the correct batch
            quantity: item.acceptedQuantity,
            referenceType: 'GOODS_RECEIPT',
            referenceId: qi.goodsReceiptId,
            performedBy: userId,
            remarks: `Stock increased via Quality Inspection: ${qi.inspectionNumber}`,
          },
          session
        );
      }
    }

    // ২. QI স্ট্যাটাস INSPECTED করা
    qi.status = 'INSPECTED';
    qi.inspectedBy = userId;
    await qi.save({
      session
    });

    // ৩. সংশ্লিষ্ট Goods Receipt (GRN)-এর স্ট্যাটাস RECEIVED করা (যদি DRAFT থাকে)
    const grn = await GoodsReceipt.findOne({
      _id: qi.goodsReceiptId,
      organizationId
    }).session(session);
    if (grn && grn.status === 'DRAFT') {
      grn.status = 'RECEIVED';
      grn.receivedAt = new Date();
      await grn.save({
        session
      });
    }

    await session.commitTransaction();
    session.endSession();

    return qi;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const cancelQualityInspection = async (organizationId, id) => {
  const qi = await QualityInspection.findOne({
    _id: id,
    organizationId
  });
  if (!qi) {
    throw new AppError('Quality Inspection not found', 404);
  }

  if (qi.status === 'INSPECTED' || qi.status === 'CANCELLED') {
    throw new AppError(`Cannot cancel Quality Inspection with status '${qi.status}'`, 400);
  }

  qi.status = 'CANCELLED';
  await qi.save();

  return qi;
};