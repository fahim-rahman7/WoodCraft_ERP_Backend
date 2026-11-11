import { z } from 'zod';

export const createCustomerSchema = z.object({
  customerCode: z.string().trim().optional(),
  name: z.string().min(1, 'Customer name is required').trim(),
  phone: z.string().optional(),
  email: z.email('Invalid email format').optional().or(z.literal('')),
  billingAddress: z.string().optional(),
  shippingAddress: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  taxId: z.string().optional(),
  creditLimit: z.number().min(0, 'Credit limit cannot be negative').optional(),
  paymentTerms: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const customerIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid customer ID format'),
});