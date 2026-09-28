import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    role: {
      type: String,
      enum: ['OWNER', 'MANAGER', 'HR', 'STAFF'],
      default: 'STAFF',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'REMOVED'],
      default: 'ACTIVE',
    },
    joinedAt: { type: Date, default: Date.now },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// Prevent duplicate active/inactive membership documents for the same user & organization
membershipSchema.index({ userId: 1, organizationId: 1 }, { unique: true });

export const Membership = mongoose.model('Membership', membershipSchema);