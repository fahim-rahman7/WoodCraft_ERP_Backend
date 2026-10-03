import mongoose from 'mongoose';

const transferSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    transferNumber: {
      type: String,
      required: [true, 'Transfer number is required'],
      uppercase: true,
      trim: true,
    },
    fromWarehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Source warehouse is required'],
    },
    toWarehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Destination warehouse is required'],
    },
    items: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Item',
          required: [true, 'Item is required'],
        },
        quantity: {
          type: Number,
          required: [true, 'Quantity is required'],
          min: [1, 'Quantity must be greater than zero'],
        },
      },
    ],
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedBy: {
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


transferSchema.index({ organizationId: 1, transferNumber: 1 }, { unique: true });

export const Transfer = mongoose.model('Transfer', transferSchema);
