import { z } from "zod";

const componentSchema = z.object({
  itemId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid component item ID"),
  quantity: z.number().positive("Quantity must be greater than zero"),
});

export const createBOMSchema = z.object({
  finishedItemId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid finished item ID"),
  quantity: z.number().positive().default(1),
  components: z
    .array(componentSchema)
    .min(1, "At least one component is required to create a BOM"),
  remarks: z.string().max(500).optional(),
});

export const updateBOMSchema = z.object({
  quantity: z.number().positive().optional(),
  components: z.array(componentSchema).min(1).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  remarks: z.string().max(500).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field is required to update",
});

export const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid BOM ID"),
});

export const listBOMQuerySchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  finishedItemId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});