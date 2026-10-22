import mongoose from 'mongoose';

const workOrderSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    workOrderNumber: {
      type: String,
      required: [true, 'Work order number is required'],
      uppercase: true,
      trim: true,
    },
    productionOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductionOrder',
      required: [true, 'Production Order reference is required'],
      index: true,
    },
    operationName: {
      type: String,
      required: [true, 'Operation name is required (e.g., Cutting, Assembly, Sanding, Polishing)'],
      trim: true,
    },
    sequence: {
      type: Number,
      default: 1,
    },
    targetQuantity: {
      type: Number,
      required: [true, 'Target quantity is required'],
      min: [0.01, 'Target quantity must be greater than zero'],
    },
    completedQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Completed quantity cannot be negative'],
    },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    remarks: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

workOrderSchema.index({ organizationId: 1, workOrderNumber: 1 }, { unique: true });

export const WorkOrder = mongoose.model('WorkOrder', workOrderSchema);