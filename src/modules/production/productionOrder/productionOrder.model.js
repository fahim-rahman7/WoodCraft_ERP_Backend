import mongoose from 'mongoose';

const requiredMaterialSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    requiredQuantity: {
      type: Number,
      required: true,
    },
    availableQuantity: {
      type: Number,
      default: 0,
    },
    isStockSufficient: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const productionOrderSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      trim: true,
    },
    targetItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    bomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bom',
      required: true,
    },
    targetQuantity: {
      type: Number,
      required: true,
      min: [1, 'Target quantity must be at least 1'],
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    requiredMaterials: [requiredMaterialSchema], // BOM থেকে অটো ক্যালকুলেট হবে
    status: {
      type: String,
      enum: ['DRAFT', 'PLANNED', 'IN_PRODUCTION', 'COMPLETED', 'CANCELLED'],
      default: 'DRAFT',
    },
    startDate: { type: Date },
    dueDate: { type: Date },
    completedAt: { type: Date },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    remarks: { type: String, trim: true },
  },
  { timestamps: true }
);

productionOrderSchema.index({ organizationId: 1, orderNumber: 1 }, { unique: true });

export const ProductionOrder = mongoose.model('ProductionOrder', productionOrderSchema);