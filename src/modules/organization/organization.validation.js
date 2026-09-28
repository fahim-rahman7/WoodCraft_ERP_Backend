import { z } from 'zod';

export const createOrgSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  plan: z.enum(['FREE', 'PRO', 'ENTERPRISE']).optional(),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['OWNER', 'MANAGER', 'HR', 'STAFF']),
});

export const updateMemberStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'REMOVED']),
});