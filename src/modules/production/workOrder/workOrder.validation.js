import { z } from 'zod';

export const createWorkOrderSchema = z.object({
  productionOrderId: z.string().min(1, 'Production Order ID is required'),
  operationName: z.string().min(1, 'Operation name is required'),
  sequence: z.number().int().positive().optional(),
  targetQuantity: z.number().positive('Target quantity must be greater than zero'),
  assignedTo: z.string().optional(),
  startDate: z.string().datetime().optional().or(z.date().optional()),
  remarks: z.string().optional(),
});

export const updateWorkOrderSchema = createWorkOrderSchema.partial();

export const updateWorkOrderProgressSchema = z.object({
  completedQuantity: z.number().min(0, 'Completed quantity cannot be negative'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});

export const workOrderIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid work order ID'),
});