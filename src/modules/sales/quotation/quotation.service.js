import { Quotation } from './quotation.model.js';
import { Customer } from '../customer/customer.model.js';
import { Item } from '../../inventory/item/item.model.js'; // Adjust path if needed based on item model location

// Helper to generate unique human-readable quotation number
const generateQuotationNumber = async (organizationId) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Quotation.countDocuments({ organizationId });
  const paddedSeq = String(count + 1).padStart(4, '0');
  return `QT-${dateStr}-${paddedSeq}`;
};

// Helper for server-side calculations (Never trust client totals)
const calculateQuotationTotals = (items) => {
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

export const createQuotationService = async (organizationId, userId, payload) => {
  // 1. Verify Customer belongs to organization
  const customer = await Customer.findOne({ _id: payload.customerId, organizationId });
  if (!customer) {
    const error = new Error('Customer not found in this organization.');
    error.statusCode = 404;
    throw error;
  }

  // 2. Fetch items and build snapshots (name, unit)
  const enrichedItems = [];
  for (const rawItem of payload.items) {
    const itemMaster = await Item.findOne({ _id: rawItem.itemId, organizationId });
    if (!itemMaster) {
      const error = new Error(`Item with ID ${rawItem.itemId} not found in this organization.`);
      error.statusCode = 404;
      throw error;
    }

    enrichedItems.push({
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
  const totals = calculateQuotationTotals(enrichedItems);
  const quotationNumber = await generateQuotationNumber(organizationId);

  // 4. Create quotation
  const quotation = await Quotation.create({
    organizationId,
    quotationNumber,
    customerId: payload.customerId,
    items: totals.items,
    subtotal: totals.subtotal,
    discountTotal: totals.discountTotal,
    taxTotal: totals.taxTotal,
    grandTotal: totals.grandTotal,
    currency: payload.currency || 'BDT',
    validUntil: new Date(payload.validUntil),
    status: 'DRAFT',
    createdBy: userId,
  });

  return quotation;
};

export const getQuotationsService = async (organizationId, query = {}) => {
  const { status, customerId, page = 1, limit = 10 } = query;
  const filter = { organizationId };

  if (status) filter.status = status;
  if (customerId) filter.customerId = customerId;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [quotations, total] = await Promise.all([
    Quotation.find(filter)
      .populate('customerId', 'name customerCode phone email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Quotation.countDocuments(filter),
  ]);

  return {
    quotations,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getQuotationByIdService = async (organizationId, quotationId) => {
  const quotation = await Quotation.findOne({ _id: quotationId, organizationId })
    .populate('customerId')
    .populate('createdBy', 'name email');

  if (!quotation) {
    const error = new Error('Quotation not found.');
    error.statusCode = 404;
    throw error;
  }
  return quotation;
};

export const updateQuotationService = async (organizationId, quotationId, payload) => {
  const quotation = await Quotation.findOne({ _id: quotationId, organizationId });
  if (!quotation) {
    const error = new Error('Quotation not found.');
    error.statusCode = 404;
    throw error;
  }

  if (quotation.status !== 'DRAFT') {
    const error = new Error(`Only DRAFT quotations can be edited. Current status is ${quotation.status}.`);
    error.statusCode = 400;
    throw error;
  }

  if (payload.customerId) {
    const customer = await Customer.findOne({ _id: payload.customerId, organizationId });
    if (!customer) {
      const error = new Error('Customer not found.');
      error.statusCode = 404;
      throw error;
    }
    quotation.customerId = payload.customerId;
  }

  if (payload.items) {
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
        quantity: rawItem.quantity,
        unitPrice: rawItem.unitPrice,
        discount: rawItem.discount || 0,
        taxRate: rawItem.taxRate || 0,
      });
    }
    const totals = calculateQuotationTotals(enrichedItems);
    quotation.items = totals.items;
    quotation.subtotal = totals.subtotal;
    quotation.discountTotal = totals.discountTotal;
    quotation.taxTotal = totals.taxTotal;
    quotation.grandTotal = totals.grandTotal;
  }

  if (payload.validUntil) quotation.validUntil = new Date(payload.validUntil);
  if (payload.currency) quotation.currency = payload.currency;

  await quotation.save();
  return quotation;
};

export const sendQuotationService = async (organizationId, quotationId) => {
  const quotation = await Quotation.findOne({ _id: quotationId, organizationId });
  if (!quotation) {
    const error = new Error('Quotation not found.');
    error.statusCode = 404;
    throw error;
  }

  if (quotation.status !== 'DRAFT') {
    const error = new Error('Only DRAFT quotations can be marked as SENT.');
    error.statusCode = 400;
    throw error;
  }

  quotation.status = 'SENT';
  await quotation.save();
  return quotation;
};

export const decisionQuotationService = async (organizationId, quotationId, status) => {
  const quotation = await Quotation.findOne({ _id: quotationId, organizationId });
  if (!quotation) {
    const error = new Error('Quotation not found.');
    error.statusCode = 404;
    throw error;
  }

  if (quotation.status !== 'SENT' && quotation.status !== 'DRAFT') {
    const error = new Error(`Cannot change status from ${quotation.status}.`);
    error.statusCode = 400;
    throw error;
  }

  quotation.status = status;
  if (status === 'ACCEPTED') {
    quotation.acceptedAt = new Date();
  }

  await quotation.save();
  return quotation;
};