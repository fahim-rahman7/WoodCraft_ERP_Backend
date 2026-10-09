import { z } from 'zod';

const materialIssueItemSchema = z.object({
  itemId: z.string({
    required_error: 'Item ID is required',
  }),
  quantity: z
    .number({
      required_error: 'Quantity is required',
    })
    .positive('Quantity must be greater than zero'),
});

export const createMaterialIssueSchema = z.object({
  warehouseId: z.string({
    required_error: 'Warehouse ID is required',
  }),
  productionOrderId: z.string().optional(),
  items: z
    .array(materialIssueItemSchema)
    .min(1, 'At least one item is required for Material Issue'),
  remarks: z.string().optional(),
});

export const updateMaterialIssueSchema = createMaterialIssueSchema.partial();