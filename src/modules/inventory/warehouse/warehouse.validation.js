import { z } from 'zod';

export const createWarehouseSchema = z.object({
  name: z
    .string({
      required_error: 'Warehouse name is required',
    })
    .trim()
    .min(1, 'Warehouse name cannot be empty'),

  code: z
    .string({
      required_error: 'Warehouse code is required',
    })
    .trim()
    .min(1, 'Warehouse code cannot be empty'),

  location: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const updateWarehouseSchema = createWarehouseSchema.partial();