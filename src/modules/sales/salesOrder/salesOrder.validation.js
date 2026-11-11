import { z } from 'zod';

const salesOrderItemValidationSchema = z.object({
  itemId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid item ID format'),
  orderedQuantity: z.number().positive('Ordered quantity must be greater than zero'),
  unitPrice: z.number().nonnegative('Unit price cannot be negative'),
  discount: z.number().nonnegative('Discount cannot be negative').optional().default(0),
  taxRate: z.number().nonnegative('Tax rate cannot be negative').optional().default(0),
});

export const createSalesOrderSchema = z.object({
  customerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid customer ID format'),
  quotationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid quotation ID format').optional(),
  preferredWarehouseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse ID format').optional(),
  requestedDeliveryDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format for requestedDeliveryDate',
  }).optional(),
  currency: z.string().optional().default('BDT'),
  items: z.array(salesOrderItemValidationSchema).min(1, 'Sales Order must contain at least one item'),
});

export const salesOrderIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid sales order ID format'),
});