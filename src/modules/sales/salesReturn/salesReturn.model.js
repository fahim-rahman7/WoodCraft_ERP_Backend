import mongoose from 'mongoose';

const salesReturnItemSchema = new mongoose.Schema({
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
  requestedQuantity: {
    type: Number,
    required: true,
    min: [0.01, 'Requested quantity must be greater than zero'],
  },
  receivedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Received quantity cannot be negative'],
  },
  acceptedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Accepted quantity cannot be negative'],
  },
  reason: {
    type: String,
    trim: true,
  },
  condition: {
    type: String,
    enum: ['GOOD', 'DAMAGED', 'DEFECTIVE'],
    default: 'GOOD',
  },
  disposition: {
    type: String,
    enum: ['RESTOCK', 'QUARANTINE', 'REWORK', 'SCRAP'],
    default: 'RESTOCK',
  },
});

const salesReturnSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    returnNumber: {
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
    deliveryNoteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryNote',
      default: null,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true, // Warehouse where goods are returned to
    },
    items: [salesReturnItemSchema],
    status: {
      type: String,
      enum: ['DRAFT', 'REQUESTED', 'APPROVED', 'RECEIVED', 'INSPECTED', 'CLOSED', 'REJECTED'],
      default: 'DRAFT',
      index: true,
    },
    receivedAt: {
      type: Date,
      default: null,
    },
    inspectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
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

salesReturnSchema.index({ organizationId: 1, returnNumber: 1 }, { unique: true });
salesReturnSchema.index({ organizationId: 1, createdAt: -1 });

export const SalesReturn = mongoose.model('SalesReturn', salesReturnSchema);