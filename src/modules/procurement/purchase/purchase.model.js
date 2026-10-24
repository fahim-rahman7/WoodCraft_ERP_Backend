import mongoose from 'mongoose';

const purchaseOrderItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    orderedQuantity: {
      type: Number,
      required: true,
      min: [0.001, 'Ordered quantity must be greater than zero'],
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, 'Unit price cannot be negative'],
    },
    receivedQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Received quantity cannot be negative'],
    },
    totalPrice: {
      type: Number,
      required: true,
    },
  },
  { _id: true }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier ID is required'],
    },
    purchaseOrderNumber: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'],
      default: 'DRAFT',
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    expectedDate: {
      type: Date,
    },
    items: [purchaseOrderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

purchaseOrderSchema.index({ organizationId: 1, purchaseOrderNumber: 1 }, { unique: true });

export const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);