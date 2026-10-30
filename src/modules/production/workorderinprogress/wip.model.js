import mongoose from 'mongoose';

/**
 * Progress log entry — প্রতিবার progress/scrap রেকর্ড করার সময় একটি snapshot রাখা হয়।
 * এতে shop-floor history audit করা যায়।
 */
const progressLogSchema = new mongoose.Schema(
  {
    quantityCompleted: {
      type: Number,
      default: 0,
      min: [0, 'Completed quantity cannot be negative'],
    },
    quantityScrapped: {
      type: Number,
      default: 0,
      min: [0, 'Scrapped quantity cannot be negative'],
    },
    materialCost: {
      type: Number,
      default: 0,
      min: [0, 'Material cost cannot be negative'],
    },
    labourCost: {
      type: Number,
      default: 0,
      min: [0, 'Labour cost cannot be negative'],
    },
    overheadCost: {
      type: Number,
      default: 0,
      min: [0, 'Overhead cost cannot be negative'],
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [1000, 'Remarks cannot exceed 1000 characters'],
    },
    loggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    loggedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

/**
 * WIP (Work In Progress) — একটি Work Order-এর ভেতরে চলমান একটি operation/stage-এর
 * in-process quantity, scrap এবং accumulated cost ট্র্যাক করে।
 */
const wipSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    wipNumber: {
      type: String,
      required: [true, 'WIP number is required'],
      uppercase: true,
      trim: true,
    },
    workOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkOrder',
      required: [true, 'Work Order reference is required'],
      index: true,
    },
    productionOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductionOrder',
      required: [true, 'Production Order reference is required'],
      index: true,
    },
    operationName: {
      type: String,
      required: [true, 'Operation name is required'],
      trim: true,
    },
    sequence: {
      type: Number,
      default: 1,
      min: [1, 'Sequence must be at least 1'],
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'],
      default: 'OPEN',
    },
    quantityIn: {
      type: Number,
      required: [true, 'Quantity put into process is required'],
      min: [0.01, 'Quantity in process must be greater than zero'],
    },
    quantityCompleted: {
      type: Number,
      default: 0,
      min: [0, 'Completed quantity cannot be negative'],
    },
    quantityScrapped: {
      type: Number,
      default: 0,
      min: [0, 'Scrapped quantity cannot be negative'],
    },
    // Accumulated WIP valuation
    materialCost: {
      type: Number,
      default: 0,
      min: [0, 'Material cost cannot be negative'],
    },
    labourCost: {
      type: Number,
      default: 0,
      min: [0, 'Labour cost cannot be negative'],
    },
    overheadCost: {
      type: Number,
      default: 0,
      min: [0, 'Overhead cost cannot be negative'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    dueDate: {
      type: Date,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [1000, 'Remarks cannot exceed 1000 characters'],
    },
    progressLogs: [progressLogSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Helpers (read-only derived values)
wipSchema.virtual('quantityBalance').get(function () {
  const balance =
    (this.quantityIn || 0) - (this.quantityCompleted || 0) - (this.quantityScrapped || 0);
  return Math.max(0, Number(balance.toFixed(3)));
});

wipSchema.virtual('totalWipValue').get(function () {
  return Number(
    ((this.materialCost || 0) + (this.labourCost || 0) + (this.overheadCost || 0)).toFixed(2)
  );
});

wipSchema.virtual('progressPercentage').get(function () {
  if (!this.quantityIn) return 0;
  return Number((((this.quantityCompleted || 0) / this.quantityIn) * 100).toFixed(2));
});

wipSchema.virtual('costPerCompletedUnit').get(function () {
  if (!this.quantityCompleted) return 0;
  const total = (this.materialCost || 0) + (this.labourCost || 0) + (this.overheadCost || 0);
  return Number((total / this.quantityCompleted).toFixed(2));
});

wipSchema.index({ organizationId: 1, wipNumber: 1 }, { unique: true });
wipSchema.index({ organizationId: 1, workOrderId: 1, status: 1 });
wipSchema.index({ organizationId: 1, status: 1 });
wipSchema.index({ organizationId: 1, productionOrderId: 1 });

export const Wip = mongoose.model('Wip', wipSchema);
