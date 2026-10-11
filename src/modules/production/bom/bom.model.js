import mongoose from "mongoose";

const bomSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    bomNumber: {
      type: String,
      required: [true, "BOM number is required"],
      uppercase: true,
      trim: true,
    },
    finishedItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: [true, "Finished Item is required"],
    },
    // quantity mane ei BOM ta koto piece finished item er jonno (sacharachor 1 thake)
    quantity: {
      type: Number,
      default: 1,
      min: [1, "Quantity must be at least 1"],
    },
    components: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Item",
          required: [true, "Component Item is required"],
        },
        quantity: {
          type: Number,
          required: [true, "Component quantity is required"],
          min: [0.001, "Quantity must be greater than zero"],
        },
      },
    ],
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    remarks: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Ek organization e same name e double BOM number thakbe na
bomSchema.index({ organizationId: 1, bomNumber: 1 }, { unique: true });
// Ekta product er sadharonoto ektai active BOM thake (optional kintu useful)
bomSchema.index({ organizationId: 1, finishedItemId: 1 });

export const BOM = mongoose.model("BOM", bomSchema);