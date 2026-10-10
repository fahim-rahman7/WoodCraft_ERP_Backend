import { z } from "zod";

// -----single item validation
const transferItemSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  quantity: z
    .number({ error: "Quantity is required and must be a number" })
    .positive("Quantity must be greater than zero"),
});

// -----create new transfer validation
export const createTransferSchema = z.object({
  fromWarehouseId: z.string().min(1, "Source warehouse is required"),
  toWarehouseId: z.string().min(1, "Destination warehouse is required"),
  items: z
    .array(transferItemSchema)
    .min(1, "At least one item is required")
    // -----same item can not be added twice
    .refine(
      (items) =>
        new Set(items.map((item) => item.itemId)).size === items.length,
      { message: "Same item cannot be added twice" },
    ),
  remarks: z.string().optional(),
});



// -----transfer id params validation
export const transferIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid transfer id"),
});
