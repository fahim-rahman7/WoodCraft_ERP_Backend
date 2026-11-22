import { z } from 'zod';

const quotationItemValidationSchema = z.object({
  itemId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid item ID format'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  unitPrice: z.number().nonnegative('Unit price cannot be negative'),
  discount: z.number().nonnegative('Discount cannot be negative').optional().default(0),
  taxRate: z.number().nonnegative('Tax rate cannot be negative').optional().default(0),
});

export const createQuotationSchema = z.object({
  customerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid customer ID format'),
  validUntil: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format for validUntil',
  }),
  currency: z.string().optional().default('BDT'),
  items: z.array(quotationItemValidationSchema).min(1, 'Quotation must contain at least one item'),
});

export const updateQuotationSchema = createQuotationSchema.partial();

export const quotationDecisionSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED'], {
    message: 'Invalid decision status',
  }),
});

export const quotationIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid quotation ID format'),
});