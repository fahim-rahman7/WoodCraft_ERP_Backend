import mongoose from "mongoose";

const adjustmentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    adjustmentNumber: {
      type: String,
      required: [true, "Adjustment number is required"],
      uppercase: true,
      trim: true,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: [true, "Warehouse is required"],
    },
    items: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Item",
          required: [true, "Item is required"],
        },
        // ----quantity in system when adjustment was created
        systemQuantity: {
          type: Number,
          required: [true, "System quantity is required"],
          min: [0, "System quantity cannot be negative"],
        },
        // ----quantity found after physical count
        physicalQuantity: {
          type: Number,
          required: [true, "Physical quantity is required"],
          min: [0, "Physical quantity cannot be negative"],
        },
        // ----physicalQuantity - systemQuantity (+ means increase, - means decrease)
        difference: {
          type: Number,
          required: [true, "Difference is required"],
        },
      },
    ],
    reason: {
      type: String,
      enum: ["DAMAGE", "LOSS", "COUNT_MISMATCH", "FOUND", "OTHER"],
      required: [true, "Reason is required"],
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "APPLIED", "CANCELLED"],
      default: "PENDING",
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

adjustmentSchema.index(
  { organizationId: 1, adjustmentNumber: 1 },
  { unique: true },
);

export const Adjustment = mongoose.model("Adjustment", adjustmentSchema);
