import mongoose from 'mongoose';

const deliveryNoteItemSchema = new mongoose.Schema({
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
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    default: null,
    required: [true, 'Batch ID is required for delivery items'],
  },
});

const deliveryNoteSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    deliveryNumber: {
      type: String,
      required: true,
      trim: true,
    },
    salesOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesOrder',
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    items: [deliveryNoteItemSchema],
    status: {
      type: String,
      enum: ['DRAFT', 'READY', 'DISPATCHED', 'CANCELLED'],
      default: 'DRAFT',
      index: true,
    },
    dispatchDate: {
      type: Date,
      default: null,
    },
    dispatchedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    remarks: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

deliveryNoteSchema.index({ organizationId: 1, deliveryNumber: 1 }, { unique: true });
deliveryNoteSchema.index({ organizationId: 1, createdAt: -1 });

export const DeliveryNote = mongoose.model('DeliveryNote', deliveryNoteSchema);