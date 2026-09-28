import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', default: null },
    plan: { type: String, enum: ['FREE', 'PRO', 'ENTERPRISE'], default: 'FREE' },
    subscriptionStatus: {
      type: String,
      enum: ['ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED'],
      default: 'ACTIVE',
    },
  },
  { timestamps: true }
);

organizationSchema.index({ ownerId: 1, name: 1 }, { unique: true });

export const Organization = mongoose.model('Organization', organizationSchema);