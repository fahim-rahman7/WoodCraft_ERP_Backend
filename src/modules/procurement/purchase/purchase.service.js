import { PurchaseOrder } from './purchase.model.js';
import { Supplier } from '../../procurement/supplier/supplier.model.js';
import { Item } from '../../inventory/item/item.model.js';
import { AppError } from '../../../utils/appError.js';

// PO Number জেনারেট করার ফাংশন (যেমন: PO-20261013-0001)
const generatePONumber = async (organizationId) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await PurchaseOrder.countDocuments({ organizationId });
  const sequence = String(count + 1).padStart(4, '0');
  return `PO-${dateStr}-${sequence}`;
};

export const createPurchaseOrder = async (organizationId, userId, payload) => {
  // ১. সাপ্লায়ার চেক করা
  const supplierExists = await Supplier.findOne({
    _id: payload.supplierId,
    organizationId,
    status: 'ACTIVE',
  });
  if (!supplierExists) {
    throw new AppError('Supplier not found or inactive', 404);
  }

  // ২. আইটেমগুলো ভ্যালিড এবং অর্গানাইজেশনের কি না চেক করা, টোটাল ক্যালকুলেট করা
  let totalAmount = 0;
  const processedItems = [];

  for (const item of payload.items) {
    const itemExists = await Item.findOne({ _id: item.itemId, organizationId, status: 'ACTIVE' });
    if (!itemExists) {
      throw new AppError(`Item not found or inactive with ID: ${item.itemId}`, 404);
    }

    const totalPrice = item.orderedQuantity * item.unitPrice;
    totalAmount += totalPrice;

    processedItems.push({
      itemId: item.itemId,
      orderedQuantity: item.orderedQuantity,
      unitPrice: item.unitPrice,
      receivedQuantity: 0,
      totalPrice,
    });
  }

  const purchaseOrderNumber = await generatePONumber(organizationId);

  const purchaseOrder = await PurchaseOrder.create({
    organizationId,
    supplierId: payload.supplierId,
    purchaseOrderNumber,
    items: processedItems,
    totalAmount,
    expectedDate: payload.expectedDate,
    remarks: payload.remarks,
    createdBy: userId,
    status: 'DRAFT',
  });

  return purchaseOrder;
};

export const getPurchaseOrders = async (organizationId, query = {}) => {
  const filter = { organizationId };

  if (query.supplierId) filter.supplierId = query.supplierId;
  if (query.status) filter.status = query.status;
  if (query.search) {
    filter.$or = [{ purchaseOrderNumber: { $regex: query.search, $options: 'i' } }];
  }

  return await PurchaseOrder.find(filter)
    .populate('supplierId', 'name phone email')
    .populate('items.itemId', 'name sku unit')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
};

export const getPurchaseOrderById = async (organizationId, id) => {
  const purchaseOrder = await PurchaseOrder.findOne({ _id: id, organizationId })
    .populate('supplierId', 'name phone email address')
    .populate('items.itemId', 'name sku unit itemType woodAttributes')
    .populate('createdBy', 'name email');

  if (!purchaseOrder) {
    throw new AppError('Purchase Order not found', 404);
  }

  return purchaseOrder;
};

export const updatePurchaseOrder = async (organizationId, id, payload) => {
  const po = await PurchaseOrder.findOne({ _id: id, organizationId });
  if (!po) {
    throw new AppError('Purchase Order not found', 404);
  }

  if (po.status !== 'DRAFT' && po.status !== 'PENDING') {
    throw new AppError(`Cannot update Purchase Order with status '${po.status}'`, 400);
  }

  // যদি আইটেম বা সাপ্লায়ার আপডেট হয় পুনরায় ক্যালকুলেশন হ্যান্ডেল করা যেতে পারে
  if (payload.supplierId) {
    const supplierExists = await Supplier.findOne({
      _id: payload.supplierId,
      organizationId,
      status: 'ACTIVE',
    });
    if (!supplierExists) throw new AppError('Supplier not found or inactive', 404);
  }

  Object.assign(po, payload);
  await po.save();
  return po;
};

export const approvePurchaseOrder = async (organizationId, id) => {
  const po = await PurchaseOrder.findOne({ _id: id, organizationId });
  if (!po) {
    throw new AppError('Purchase Order not found', 404);
  }

  if (po.status !== 'DRAFT' && po.status !== 'PENDING') {
    throw new AppError(`Only DRAFT or PENDING orders can be approved`, 400);
  }

  po.status = 'APPROVED';
  await po.save();
  return po;
};

export const cancelPurchaseOrder = async (organizationId, id) => {
  const po = await PurchaseOrder.findOne({ _id: id, organizationId });
  if (!po) {
    throw new AppError('Purchase Order not found', 404);
  }

  if (po.status === 'RECEIVED' || po.status === 'CANCELLED') {
    throw new AppError(`Cannot cancel Purchase Order with status '${po.status}'`, 400);
  }

  po.status = 'CANCELLED';
  await po.save();
  return po;
};