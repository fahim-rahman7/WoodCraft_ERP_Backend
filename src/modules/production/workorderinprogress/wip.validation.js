import { z } from 'zod';

const objectId = (label) => z.string().regex(/^[a-f\d]{24}$/i, `Invalid ${label} ID`);

export const createWipSchema = z.object({
  workOrderId: objectId('work order'),
  quantityIn: z
    .number()
    .positive('Quantity put into process must be greater than zero'),
  warehouseId: objectId('warehouse').optional(),
  assignedTo: objectId('user').optional(),
  materialCost: z.number().min(0, 'Material cost cannot be negative').optional(),
  labourCost: z.number().min(0, 'Labour cost cannot be negative').optional(),
  overheadCost: z.number().min(0, 'Overhead cost cannot be negative').optional(),
  dueDate: z.coerce.date().optional(),
  remarks: z.string().max(1000, 'Remarks cannot exceed 1000 characters').optional(),
});

export const updateWipProgressSchema = z.object({
  // Incremental quantities (আগের মানের সাথে যোগ হবে)
  quantityCompleted: z
    .number()
    .positive('Completed quantity must be greater than zero'),
  quantityScrapped: z
    .number()
    .min(0, 'Scrapped quantity cannot be negative')
    .optional()
    .default(0),
  materialCost: z.number().min(0, 'Material cost cannot be negative').optional().default(0),
  labourCost: z.number().min(0, 'Labour cost cannot be negative').optional().default(0),
  overheadCost: z.number().min(0, 'Overhead cost cannot be negative').optional().default(0),
  remarks: z.string().max(1000, 'Remarks cannot exceed 1000 characters').optional(),
});

export const scrapWipSchema = z.object({
  quantity: z.number().positive('Scrap quantity must be greater than zero'),
  materialCost: z.number().min(0, 'Material cost cannot be negative').optional().default(0),
  labourCost: z.number().min(0, 'Labour cost cannot be negative').optional().default(0),
  overheadCost: z.number().min(0, 'Overhead cost cannot be negative').optional().default(0),
  remarks: z.string().max(1000, 'Remarks cannot exceed 1000 characters').optional(),
});

export const wipActionSchema = z.object({
  remarks: z.string().max(1000, 'Remarks cannot exceed 1000 characters').optional(),
});

// Lifecycle actions (start/hold/resume/complete/cancel) body ছাড়াও call করা যাবে
export const optionalWipActionSchema = wipActionSchema.optional();

export const wipIdParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid WIP ID'),
});
