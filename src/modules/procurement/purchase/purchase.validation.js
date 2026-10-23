import { z } from 'zod';

export const createPurchaseSchema = z.object({
  supplierId: z
    .string({ required_error: 'Supplier ID is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid supplier ID format'),
  expectedDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  remarks: z.string().optional(),
  items: z
    .array(
      z.object({
        itemId: z
          .string({ required_error: 'Item ID is required' })
          .regex(/^[0-9a-fA-F]{24}$/, 'Invalid item ID format'),
        orderedQuantity: z.number().positive('Ordered quantity must be greater than zero'),
        unitPrice: z.number().nonnegative('Unit price cannot be negative'),
      })
    )
    .min(1, 'At least one purchase item is required'),
});

export const updatePurchaseSchema = createPurchaseSchema.partial();

export const purchaseIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid purchase order ID format'),
});