import mongoose from 'mongoose';

const salesOrderItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
  },
  name: {
    type: String,
    required: true, // Item name snapshot
  },
  unit: {
    type: String,
    required: true, // Unit snapshot (e.g., PCS, CFT)
  },
  orderedQuantity: {
    type: Number,
    required: true,
    min: [0.01, 'Ordered quantity must be greater than zero'],
  },
  deliveredQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Delivered quantity cannot be negative'],
  },
  invoicedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Invoiced quantity cannot be negative'],
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, 'Unit price cannot be negative'],
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
  },
  taxRate: {
    type: Number,
    default: 0,
    min: [0, 'Tax rate cannot be negative'],
  },
  lineTotal: {
    type: Number,
    required: true,
  },
});

const salesOrderSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      trim: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    quotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation',
      default: null,
    },
    preferredWarehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      default: null,
    },
    items: [salesOrderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    discountTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    taxTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      default: 'BDT',
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    requestedDeliveryDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'CONFIRMED', 'PARTIALLY_DELIVERED', 'DELIVERED', 'CANCELLED', 'CLOSED'],
      default: 'DRAFT',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Organization-scoped unique order number index
salesOrderSchema.index({ organizationId: 1, orderNumber: 1 }, { unique: true });
salesOrderSchema.index({ organizationId: 1, createdAt: -1 });

export const SalesOrder = mongoose.model('SalesOrder', salesOrderSchema);