import mongoose from 'mongoose';

const qualityInspectionItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
    },
    receivedQuantity: {
      type: Number,
      required: true,
      min: [0, 'Received quantity cannot be negative'],
    },
    acceptedQuantity: {
      type: Number,
      required: true,
      min: [0, 'Accepted quantity cannot be negative'],
    },
    rejectedQuantity: {
      type: Number,
      required: true,
      min: [0, 'Rejected quantity cannot be negative'],
    },
    inspectionResult: {
      type: String,
      enum: ['PASS', 'FAIL', 'PARTIAL'],
      default: 'PASS',
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const qualityInspectionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    inspectionNumber: {
      type: String,
      required: true,
      trim: true,
    },
    goodsReceiptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GoodsReceipt',
      required: [true, 'Goods Receipt ID is required'],
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier ID is required'],
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Warehouse ID is required'],
    },
    status: {
      type: String,
      enum: ['PENDING', 'INSPECTED', 'CANCELLED'],
      default: 'PENDING',
    },
    inspectionDate: {
      type: Date,
      default: Date.now,
    },
    items: [qualityInspectionItemSchema],
    inspectedBy: {
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

qualityInspectionSchema.index({ organizationId: 1, inspectionNumber: 1 }, { unique: true });

export const QualityInspection = mongoose.model('QualityInspection', qualityInspectionSchema);