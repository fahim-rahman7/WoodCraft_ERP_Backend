import { z } from 'zod';

export const membershipParamSchema = z.object({
  memberId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid membership ID format'),
});