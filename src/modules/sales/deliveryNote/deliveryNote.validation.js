import { z } from 'zod';

const deliveryNoteItemValidationSchema = z.object({
  salesOrderItemId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid sales order item ID format'),
  itemId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid item ID format'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  batchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid batch ID format'),
});

export const createDeliveryNoteSchema = z.object({
  salesOrderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid sales order ID format'),
  warehouseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse ID format'),
  remarks: z.string().optional(),
  items: z.array(deliveryNoteItemValidationSchema).min(1, 'Delivery note must contain at least one item'),
});

export const deliveryNoteIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid delivery note ID format'),
});