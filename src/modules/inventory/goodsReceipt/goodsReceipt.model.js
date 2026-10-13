import mongoose from 'mongoose';

const goodsReceiptItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0.001, 'Quantity must be greater than zero'],
    },
    unitPrice: {
      type: Number,
      default: 0,
      min: [0, 'Unit price cannot be negative'],
    },
    totalPrice: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const goodsReceiptSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    purchaseOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    grnNumber: {
      type: String,
      required: true,
      trim: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier ID is required'],
    },
    supplierInvoiceNo: {
      type: String,
      trim: true,
    },
    items: [goodsReceiptItemSchema],
    totalAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'RECEIVED', 'CANCELLED'],
      default: 'DRAFT',
    },
    receivedAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// grnNumber অর্গানাইজেশনে ইউনিক হবে
goodsReceiptSchema.index({ organizationId: 1, grnNumber: 1 }, { unique: true });

// 🆕 একই সাপ্লায়ারের জন্য supplierInvoiceNo যেন অর্গানাইজেশনে ডুপ্লিকেট না হয়
goodsReceiptSchema.index(
  { organizationId: 1, supplierId: 1, supplierInvoiceNo: 1 },
  { unique: true, sparse: true }
);

export const GoodsReceipt = mongoose.model('GoodsReceipt', goodsReceiptSchema);