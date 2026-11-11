import mongoose from 'mongoose';

const salesInvoiceItemSchema = new mongoose.Schema({
  salesOrderItemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
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
    required: true, // Unit snapshot
  },
  quantity: {
    type: Number,
    required: true,
    min: [0.01, 'Quantity must be greater than zero'],
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

const salesInvoiceSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    invoiceNumber: {
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
    salesOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesOrder',
      required: true,
      index: true,
    },
    deliveryNoteIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryNote',
      },
    ],
    items: [salesInvoiceItemSchema],
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
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'ISSUED', 'VOID', 'CANCELLED'],
      default: 'DRAFT',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    issuedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

salesInvoiceSchema.index({ organizationId: 1, invoiceNumber: 1 }, { unique: true });
salesInvoiceSchema.index({ organizationId: 1, createdAt: -1 });

export const SalesInvoice = mongoose.model('SalesInvoice', salesInvoiceSchema);