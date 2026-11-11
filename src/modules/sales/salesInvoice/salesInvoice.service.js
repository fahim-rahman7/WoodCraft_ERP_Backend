import { SalesInvoice } from './salesInvoice.model.js';
import { SalesOrder } from '../salesOrder/salesOrder.model.js';
import { Item } from '../../inventory/item/item.model.js';

// Helper to generate unique invoice number
const generateInvoiceNumber = async (organizationId) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await SalesInvoice.countDocuments({ organizationId });
  const paddedSeq = String(count + 1).padStart(4, '0');
  return `INV-${dateStr}-${paddedSeq}`;
};

// Server-side secure total calculations
const calculateInvoiceTotals = (items) => {
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;

  const processedItems = items.map((item) => {
    const lineBase = item.quantity * item.unitPrice;
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

export const createSalesInvoiceService = async (organizationId, userId, payload) => {
  // 1. Verify Sales Order
  const salesOrder = await SalesOrder.findOne({ _id: payload.salesOrderId, organizationId });
  if (!salesOrder) {
    const error = new Error('Sales Order not found.');
    error.statusCode = 404;
    throw error;
  }

  // 2. Validate items against delivered quantities in Sales Order[cite: 20]
  const enrichedItems = [];
  for (const rawItem of payload.items) {
    const soItem = salesOrder.items.id(rawItem.salesOrderItemId);
    if (!soItem) {
      const error = new Error(`Sales Order Item ID ${rawItem.salesOrderItemId} not found in order.`);
      error.statusCode = 400;
      throw error;
    }

    // Check if invoice quantity exceeds delivered quantity minus already invoiced quantity
    const invoiceableQty = soItem.deliveredQuantity - soItem.invoicedQuantity;
    if (rawItem.quantity > invoiceableQty) {
      const error = new Error(`Invoice quantity (${rawItem.quantity}) exceeds remaining invoiceable delivered quantity (${invoiceableQty}) for item ${soItem.name}.`);
      error.statusCode = 400;
      throw error;
    }

    const itemMaster = await Item.findOne({ _id: rawItem.itemId, organizationId });
    if (!itemMaster) {
      const error = new Error(`Item ID ${rawItem.itemId} not found.`);
      error.statusCode = 404;
      throw error;
    }

    enrichedItems.push({
      salesOrderItemId: soItem._id,
      itemId: itemMaster._id,
      name: itemMaster.name,
      unit: itemMaster.unit || 'PCS',
      quantity: rawItem.quantity,
      unitPrice: rawItem.unitPrice,
      discount: rawItem.discount || 0,
      taxRate: rawItem.taxRate || 0,
    });
  }

  // 3. Calculate totals securely on server
  const totals = calculateInvoiceTotals(enrichedItems);
  const invoiceNumber = await generateInvoiceNumber(organizationId);

  // 4. Create Invoice Draft (Does not touch stock)
  const invoice = await SalesInvoice.create({
    organizationId,
    invoiceNumber,
    customerId: salesOrder.customerId,
    salesOrderId: salesOrder._id,
    deliveryNoteIds: payload.deliveryNoteIds || [],
    items: totals.items,
    subtotal: totals.subtotal,
    discountTotal: totals.discountTotal,
    taxTotal: totals.taxTotal,
    grandTotal: totals.grandTotal,
    currency: payload.currency || 'BDT',
    dueDate: new Date(payload.dueDate),
    status: 'DRAFT',
    createdBy: userId,
  });

  return invoice;
};

export const getSalesInvoicesService = async (organizationId, query = {}) => {
  const { status, salesOrderId, customerId, page = 1, limit = 10 } = query;
  const filter = { organizationId };

  if (status) filter.status = status;
  if (salesOrderId) filter.salesOrderId = salesOrderId;
  if (customerId) filter.customerId = customerId;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [invoices, total] = await Promise.all([
    SalesInvoice.find(filter)
      .populate('customerId', 'name customerCode')
      .populate('salesOrderId', 'orderNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    SalesInvoice.countDocuments(filter),
  ]);

  return {
    invoices,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getSalesInvoiceByIdService = async (organizationId, invoiceId) => {
  const invoice = await SalesInvoice.findOne({ _id: invoiceId, organizationId })
    .populate('customerId')
    .populate('salesOrderId')
    .populate('deliveryNoteIds')
    .populate('createdBy', 'name email')
    .populate('issuedBy', 'name email');

  if (!invoice) {
    const error = new Error('Sales Invoice not found.');
    error.statusCode = 404;
    throw error;
  }
  return invoice;
};

// ISSUE INVOICE: Updates invoiced quantities and hands off to Finance tracking[cite: 12]
export const issueSalesInvoiceService = async (organizationId, userId, invoiceId) => {
  const invoice = await SalesInvoice.findOne({ _id: invoiceId, organizationId });
  if (!invoice) {
    const error = new Error('Sales Invoice not found.');
    error.statusCode = 404;
    throw error;
  }

  if (invoice.status === 'ISSUED') {
    const error = new Error('This invoice has already been issued.');
    error.statusCode = 400;
    throw error;
  }

  if (invoice.status !== 'DRAFT') {
    const error = new Error(`Cannot issue invoice with status: ${invoice.status}`);
    error.statusCode = 400;
    throw error;
  }

  const salesOrder = await SalesOrder.findOne({ _id: invoice.salesOrderId, organizationId });
  if (!salesOrder) {
    const error = new Error('Associated Sales Order not found.');
    error.statusCode = 404;
    throw error;
  }

  // Update invoiced quantities in Sales Order items
  for (const invItem of invoice.items) {
    const soItem = salesOrder.items.id(invItem.salesOrderItemId);
    if (soItem) {
      soItem.invoicedQuantity += invItem.quantity;
    }
  }
  await salesOrder.save();

  invoice.status = 'ISSUED';
  invoice.issuedBy = userId;
  invoice.issuedAt = new Date();
  await invoice.save();

  return invoice;
};