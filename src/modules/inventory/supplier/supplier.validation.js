import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z.string({ required_error: 'Supplier name is required' }).trim().min(1, 'Name cannot be empty'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string({ required_error: 'Phone number is required' }).trim().min(1, 'Phone cannot be empty'),
  address: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export const supplierIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid supplier ID format'),
});