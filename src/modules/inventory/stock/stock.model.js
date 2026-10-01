import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema(
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
      index: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Stock quantity cannot be negative'],
    },
    reservedQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Reserved quantity cannot be negative'],
    },
    availableQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Available quantity cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

stockSchema.index({ organizationId: 1, warehouseId: 1, itemId: 1 }, { unique: true });

export const Stock = mongoose.model('Stock', stockSchema);