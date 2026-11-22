import { z } from 'zod';

const salesInvoiceItemValidationSchema = z.object({
  salesOrderItemId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid sales order item ID format'),
  itemId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid item ID format'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  unitPrice: z.number().nonnegative('Unit price cannot be negative'),
  discount: z.number().nonnegative('Discount cannot be negative').optional().default(0),
  taxRate: z.number().nonnegative('Tax rate cannot be negative').optional().default(0),
});

export const createSalesInvoiceSchema = z.object({
  salesOrderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid sales order ID format'),
  deliveryNoteIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid delivery note ID format')).optional().default([]),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format for dueDate',
  }),
  currency: z.string().optional().default('BDT'),
  items: z.array(salesInvoiceItemValidationSchema).min(1, 'Invoice must contain at least one item'),
});

export const salesInvoiceIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid sales invoice ID format'),
});