import { z } from "zod";

// -----single item validation
const adjustmentItemSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  physicalQuantity: z
    .number({ error: "Physical quantity is required and must be a number" })
    .min(0, "Physical quantity cannot be negative"),
});

// -----create new adjustment validation
export const createAdjustmentSchema = z.object({
  warehouseId: z.string().min(1, "Warehouse is required"),
  items: z
    .array(adjustmentItemSchema)
    .min(1, "At least one item is required")
    // -----same item can not be added twice
    .refine(
      (items) =>
        new Set(items.map((item) => item.itemId)).size === items.length,
      { message: "Same item cannot be added twice" },
    ),
  reason: z.enum(["DAMAGE", "LOSS", "COUNT_MISMATCH", "FOUND", "OTHER"], {
    error: "Reason must be one of DAMAGE, LOSS, COUNT_MISMATCH, FOUND, OTHER",
  }),
  remarks: z.string().optional(),
});

// -----adjustment id params validation
export const adjustmentIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid adjustment id"),
});
