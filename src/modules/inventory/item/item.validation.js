import { z } from 'zod';

export const createItemSchema = z.object({
  categoryId: z
    .string({
      required_error: 'Category ID is required',
    })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID format'),

  name: z
    .string({
      required_error: 'Item name is required',
    })
    .trim()
    .min(1, 'Item name cannot be empty'),

  sku: z
    .string({
      required_error: 'SKU is required',
    })
    .trim()
    .min(1, 'SKU cannot be empty'),

  unit: z.enum(['CFT', 'SFT', 'PCS', 'KG', 'LITER', 'BOX', 'PACKET'], {
    required_error: 'Unit is required',
  }),

  itemType: z
    .enum(['RAW_MATERIAL', 'CONSUMABLE', 'FINISHED_GOODS', 'HARDWARE'])
    .optional(),

  woodAttributes: z
    .object({
      species: z.string().optional(),
      grade: z.string().optional(),
      thickness: z.number().optional(),
      width: z.number().optional(),
      length: z.number().optional(),
      moistureContent: z.number().optional(),
    })
    .optional(),

  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const itemIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid item ID format'),
});

export const updateItemSchema = createItemSchema.partial();