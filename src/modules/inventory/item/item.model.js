import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      uppercase: true,
      trim: true,
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      enum: ['CFT', 'SFT', 'PCS', 'KG', 'LITER', 'BOX', 'PACKET'],
      default: 'PCS',
    },
    itemType: {
      type: String,
      enum: ['RAW_MATERIAL', 'CONSUMABLE', 'FINISHED_GOODS', 'HARDWARE'],
      default: 'RAW_MATERIAL',
    },
    woodAttributes: {
      species: { type: String, trim: true },
      grade: { type: String, trim: true },
      thickness: { type: Number },
      width: { type: Number },
      length: { type: Number },
      moistureContent: { type: Number },
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

itemSchema.index({ organizationId: 1, sku: 1 }, { unique: true });

export const Item = mongoose.model('Item', itemSchema);