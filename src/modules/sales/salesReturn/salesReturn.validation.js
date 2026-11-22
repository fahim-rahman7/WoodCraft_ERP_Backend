import { z } from 'zod';

const salesReturnItemValidationSchema = z.object({
  itemId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid item ID format'),
  requestedQuantity: z.number().positive('Requested quantity must be greater than zero'),
  reason: z.string().optional(),
});

export const createSalesReturnSchema = z.object({
  salesOrderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid sales order ID format'),
  deliveryNoteId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid delivery note ID format').optional().nullable(),
  warehouseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse ID format'),
  items: z.array(salesReturnItemValidationSchema).min(1, 'Sales return must contain at least one item'),
});

const receiveItemValidationSchema = z.object({
  itemId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid item ID format'),
  receivedQuantity: z.number().nonnegative('Received quantity cannot be negative'),
});

export const receiveSalesReturnSchema = z.object({
  items: z.array(receiveItemValidationSchema).min(1, 'At least one item required for receiving'),
});

const inspectItemValidationSchema = z.object({
  itemId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid item ID format'),
  acceptedQuantity: z.number().nonnegative('Accepted quantity cannot be negative'),
  condition: z.enum(['GOOD', 'DAMAGED', 'DEFECTIVE']),
  disposition: z.enum(['RESTOCK', 'QUARANTINE', 'REWORK', 'SCRAP']),
});

export const inspectSalesReturnSchema = z.object({
  items: z.array(inspectItemValidationSchema).min(1, 'At least one item required for inspection'),
});

export const salesReturnIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid sales return ID format'),
});