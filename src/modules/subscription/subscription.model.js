import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      unique: true,
    },
    tranId: { type: String, default: null },
    valId: { type: String, default: null },
    plan: {
      type: String,
      enum: ['FREE', 'PRO', 'ENTERPRISE'],
      default: 'FREE',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED', 'PENDING'],
      default: 'ACTIVE',
    },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'BDT' },
    currentPeriodEnd: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model('Subscription', subscriptionSchema);