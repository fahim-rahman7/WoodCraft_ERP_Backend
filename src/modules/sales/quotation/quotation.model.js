import mongoose from 'mongoose';

const quotationItemSchema = new mongoose.Schema({
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

const quotationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    quotationNumber: {
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
    items: [quotationItemSchema],
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
    validUntil: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED'],
      default: 'DRAFT',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    acceptedAt: {
      type: Date,
    },
    convertedSalesOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesOrder',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Organization-scoped unique quotation number index
quotationSchema.index({ organizationId: 1, quotationNumber: 1 }, { unique: true });
quotationSchema.index({ organizationId: 1, createdAt: -1 });

export const Quotation = mongoose.model('Quotation', quotationSchema);