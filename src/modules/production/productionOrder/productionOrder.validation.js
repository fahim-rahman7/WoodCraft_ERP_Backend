import { z } from 'zod';

export const createProductionOrderSchema = z.object({
  targetItemId: z.string({
    required_error: 'Target Item ID (Finished Good) is required',
  }),
  targetQuantity: z
    .number({ required_error: 'Target quantity is required' })
    .positive('Target quantity must be greater than zero'),
  warehouseId: z.string({
    required_error: 'Warehouse ID is required',
  }),
  bomId: z.string().optional(), // নির্দিষ্ট BOM আইডি (অপশনাল, না দিলে একটিভ BOM সিলেক্ট হবে)
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  remarks: z.string().optional(),
});

export const updateProductionOrderSchema = createProductionOrderSchema.partial();

// ID Validation Schema যোগ করা হলো
export const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid Production Order ID"),
});