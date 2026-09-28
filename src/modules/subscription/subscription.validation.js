import { z } from 'zod';

export const createCheckoutSchema = z.object({
  plan: z.enum(['PRO', 'ENTERPRISE']),
  cusPhone: z.string().min(11, 'Valid contact phone number is required'),
});