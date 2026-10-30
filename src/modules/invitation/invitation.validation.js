import { z } from 'zod';

export const createInvitationSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    role: z.enum(['MANAGER', 'HR', 'STAFF'], {
      message: 'Role must be either MANAGER, HR, or STAFF',
    }),
  }),
});

export const acceptInvitationSchema = z.object({
  body: z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters' }).optional(),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }).optional(),
  }),
  params: z.object({
    token: z.string({ message: 'Invitation token is required' }),
  }),
});