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
    supplierName: {
      type: String,
      trim: true,
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

goodsReceiptSchema.index({ organizationId: 1, grnNumber: 1 }, { unique: true });

export const GoodsReceipt = mongoose.model('GoodsReceipt', goodsReceiptSchema);