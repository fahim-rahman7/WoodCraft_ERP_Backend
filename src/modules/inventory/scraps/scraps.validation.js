import { z } from "zod";

// -----single scrap item validation
const scrapsItemSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  batchId: z.string().min(1, "Batch is required"),
  quantity: z
    .number({ error: "Quantity is required and must be a number" })
    .positive("Quantity must be greater than zero"),
  reason: z.enum(
    ["DAMAGE", "OFFCUT", "PRODUCTION_WASTE", "DEFECTIVE", "EXPIRED", "OTHER"],
    {
      error:
        "Reason must be one of DAMAGE, OFFCUT, PRODUCTION_WASTE, DEFECTIVE, EXPIRED, OTHER",
    },
  ),
});

// -----create new scraps validation
export const createScrapsSchema = z.object({
  warehouseId: z.string().min(1, "Warehouse is required"),
  items: z
    .array(scrapsItemSchema)
    .min(1, "At least one item is required")
    // -----same item with same batch can not be added twice
    .refine(
      (items) =>
        new Set(items.map((item) => `${item.itemId}-${item.batchId}`)).size ===
        items.length,
      { message: "Same item with same batch cannot be added twice" },
    ),
  remarks: z.string().optional(),
});

// -----scraps id params validation
export const scrapsIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid scrap id"),
});
