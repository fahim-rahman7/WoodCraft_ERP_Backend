import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema(
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
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    movementType: {
      type: String,
      enum: ['IN', 'OUT', 'RESERVE', 'RELEASE', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT'],
      required: true,
    },
    referenceType: {
      type: String,
      enum: [
        'GOODS_RECEIPT',
        'MATERIAL_ISSUE',
        'PRODUCTION_ORDER',
        'STOCK_TRANSFER',
        'STOCK_ADJUSTMENT',
        'INITIAL_STOCK',
      ],
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    quantity: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
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

export const StockMovement = mongoose.model('StockMovement', stockMovementSchema);