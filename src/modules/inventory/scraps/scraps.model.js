import mongoose from "mongoose";

const scrapSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    scrapNumber: {
      type: String,
      required: [true, "Scrap number is required"],
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
        batchId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Batch",
          required: [true, "Batch is required"],
        },
        quantity: {
          type: Number,
          required: [true, "Quantity is required"],
          min: [0.01, "Quantity must be greater than zero"],
        },
        reason: {
          type: String,
          enum: [
            "DAMAGE",
            "OFFCUT",
            "PRODUCTION_WASTE",
            "DEFECTIVE",
            "EXPIRED",
            "OTHER",
          ],
          required: [true, "Reason is required"],
        },
      },
    ],
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

scrapSchema.index({ organizationId: 1, scrapNumber: 1 }, { unique: true });

export const Scrap = mongoose.model("Scrap", scrapSchema);