import { z } from "zod";

// -----create new transfer validation
export const createTransferSchema = z.object({
  fromWarehouseId: z.string().min(1, "Source warehouse is required"),
  toWarehouseId: z.string().min(1, "Destination warehouse is required"),
  itemId: z.string().min(1, "Item is required"),
  quantity: z
    .number({ error: "Quantity is required and must be a number" })
    .positive("Quantity must be greater than zero"),
  remarks: z.string().optional(),
});
