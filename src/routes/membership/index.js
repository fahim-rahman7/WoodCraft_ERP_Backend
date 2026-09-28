import { Router } from 'express';
import * as membershipController from '../../modules/membership/membership.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { requireOrgContext, checkOrgRole } from '../../middlewares/org.middleware.js';
import { membershipParamSchema } from '../../modules/membership/membership.validation.js';

const router = Router();

// Global Auth required
router.use(protect);

// User level: List all organizations the user belongs to
router.get('/me', membershipController.getMyMemberships);

// Tenant-scoped: Get current user membership context for active org header
router.get('/context', requireOrgContext, membershipController.getActiveContext);

// Tenant-scoped: Self-service leave organization
router.delete('/leave', requireOrgContext, membershipController.leaveOrg);

// Tenant-scoped: Admin/Manager remove member
router.delete(
  '/:memberId',
  requireOrgContext,
  checkOrgRole('OWNER', 'MANAGER'),
  validate(membershipParamSchema, 'params'),
  membershipController.removeMember
);

export default router;