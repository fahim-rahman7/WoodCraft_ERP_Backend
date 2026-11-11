import { SalesOrder } from './salesOrder.model.js';
import { Customer } from '../customer/customer.model.js';
import { Quotation } from '../quotation/quotation.model.js';
import { Item } from '../../inventory/item/item.model.js';
import { Warehouse } from '../../inventory/warehouse/warehouse.model.js';

// Helper to generate unique human-readable order number
const generateOrderNumber = async (organizationId) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await SalesOrder.countDocuments({ organizationId });
  const paddedSeq = String(count + 1).padStart(4, '0');
  return `SO-${dateStr}-${paddedSeq}`;
};

// Server-side secure total calculations
const calculateOrderTotals = (items) => {
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;

  const processedItems = items.map((item) => {
    const lineBase = item.orderedQuantity * item.unitPrice;
    const lineDiscount = item.discount || 0;
    const taxableAmount = Math.max(0, lineBase - lineDiscount);
    const lineTax = (taxableAmount * (item.taxRate || 0)) / 100;
    const lineTotal = taxableAmount + lineTax;

    subtotal += lineBase;
    discountTotal += lineDiscount;
    taxTotal += lineTax;

    return {
      ...item,
      lineTotal: parseFloat(lineTotal.toFixed(2)),
      deliveredQuantity: 0,
      invoicedQuantity: 0,
    };
  });

  const grandTotal = subtotal - discountTotal + taxTotal;

  return {
    items: processedItems,
    subtotal: parseFloat(subtotal.toFixed(2)),
    discountTotal: parseFloat(discountTotal.toFixed(2)),
    taxTotal: parseFloat(taxTotal.toFixed(2)),
    grandTotal: parseFloat(grandTotal.toFixed(2)),
  };
};

export const createSalesOrderService = async (organizationId, userId, payload) => {
  // 1. Verify Customer
  const customer = await Customer.findOne({ _id: payload.customerId, organizationId });
  if (!customer) {
    const error = new Error('Customer not found in this organization.');
    error.statusCode = 404;
    throw error;
  }
// 1.5. Verify Preferred Warehouse if provided
if (payload.preferredWarehouseId) {
    const warehouse = await Warehouse.findOne({ 
      _id: payload.preferredWarehouseId, 
      organizationId 
    });
    if (!warehouse) {
      const error = new Error('Preferred warehouse not found in this organization.');
      error.statusCode = 404;
      throw error;
    }
  }

  // 2. If quotationId is provided, check validity and prevent duplicate conversion
  if (payload.quotationId) {
    const quotation = await Quotation.findOne({ _id: payload.quotationId, organizationId });
    if (!quotation) {
      const error = new Error('Quotation not found.');
      error.statusCode = 404;
      throw error;
    }
    if (quotation.status !== 'ACCEPTED') {
      const error = new Error('Only ACCEPTED quotations can be converted to Sales Orders.');
      error.statusCode = 400;
      throw error;
    }
    if (quotation.convertedSalesOrderId) {
      const error = new Error('This quotation has already been converted to a Sales Order.');
      error.statusCode = 400;
      throw error;
    }
  }

  // 3. Enrich items with snapshots from Item master
  const enrichedItems = [];
  for (const rawItem of payload.items) {
    const itemMaster = await Item.findOne({ _id: rawItem.itemId, organizationId });
    if (!itemMaster) {
      const error = new Error(`Item with ID ${rawItem.itemId} not found.`);
      error.statusCode = 404;
      throw error;
    }

    enrichedItems.push({
      itemId: itemMaster._id,
      name: itemMaster.name,
      unit: itemMaster.unit || 'PCS',
      orderedQuantity: rawItem.orderedQuantity,
      unitPrice: rawItem.unitPrice,
      discount: rawItem.discount || 0,
      taxRate: rawItem.taxRate || 0,
    });
  }

  // 4. Calculate totals
  const totals = calculateOrderTotals(enrichedItems);
  const orderNumber = await generateOrderNumber(organizationId);

  // 5. Create Sales Order
  const salesOrder = await SalesOrder.create({
    organizationId,
    orderNumber,
    customerId: payload.customerId,
    quotationId: payload.quotationId || null,
    preferredWarehouseId: payload.preferredWarehouseId || null,
    items: totals.items,
    subtotal: totals.subtotal,
    discountTotal: totals.discountTotal,
    taxTotal: totals.taxTotal,
    grandTotal: totals.grandTotal,
    currency: payload.currency || 'BDT',
    requestedDeliveryDate: payload.requestedDeliveryDate ? new Date(payload.requestedDeliveryDate) : null,
    status: 'DRAFT',
    createdBy: userId,
  });

  // 6. If converted from quotation, link it back
  if (payload.quotationId) {
    await Quotation.findByIdAndUpdate(payload.quotationId, {
      convertedSalesOrderId: salesOrder._id,
    });
  }

  return salesOrder;
};

export const getSalesOrdersService = async (organizationId, query = {}) => {
  const { status, customerId, page = 1, limit = 10 } = query;
  const filter = { organizationId };

  if (status) filter.status = status;
  if (customerId) filter.customerId = customerId;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [salesOrders, total] = await Promise.all([
    SalesOrder.find(filter)
      .populate('customerId', 'name customerCode phone email')
      .populate('preferredWarehouseId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    SalesOrder.countDocuments(filter),
  ]);

  return {
    salesOrders,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getSalesOrderByIdService = async (organizationId, orderId) => {
  const salesOrder = await SalesOrder.findOne({ _id: orderId, organizationId })
    .populate('customerId')
    .populate('preferredWarehouseId')
    .populate('quotationId')
    .populate('createdBy', 'name email')
    .populate('confirmedBy', 'name email');

  if (!salesOrder) {
    const error = new Error('Sales Order not found.');
    error.statusCode = 404;
    throw error;
  }
  return salesOrder;
};

export const confirmSalesOrderService = async (organizationId, userId, orderId) => {
  const salesOrder = await SalesOrder.findOne({ _id: orderId, organizationId });
  if (!salesOrder) {
    const error = new Error('Sales Order not found.');
    error.statusCode = 404;
    throw error;
  }

  if (salesOrder.status !== 'DRAFT') {
    const error = new Error(`Only DRAFT orders can be confirmed. Current status is ${salesOrder.status}.`);
    error.statusCode = 400;
    throw error;
  }

  salesOrder.status = 'CONFIRMED';
  salesOrder.confirmedBy = userId;
  salesOrder.confirmedAt = new Date();

  await salesOrder.save();
  return salesOrder;
};

export const cancelSalesOrderService = async (organizationId, orderId) => {
  const salesOrder = await SalesOrder.findOne({ _id: orderId, organizationId });
  if (!salesOrder) {
    const error = new Error('Sales Order not found.');
    error.statusCode = 404;
    throw error;
  }

  if (['DELIVERED', 'CLOSED'].includes(salesOrder.status)) {
    const error = new Error(`Cannot cancel a ${salesOrder.status} sales order.`);
    error.statusCode = 400;
    throw error;
  }

  salesOrder.status = 'CANCELLED';
  await salesOrder.save();
  return salesOrder;
};