import { Router } from 'express';
import * as orgController from '../../modules/organization/organization.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { requireOrgContext, checkOrgRole } from '../../middlewares/org.middleware.js';
import {
  createOrgSchema,
  updateMemberRoleSchema,
  updateMemberStatusSchema,
} from '../../modules/organization/organization.validation.js';

const router = Router();

// Require global user authentication for all organization routes
router.use(protect);

// Platform User Level Endpoints
router.post('/create', validate(createOrgSchema), orgController.createOrganization);
router.get('/', orgController.getMyOrganizations);

// Tenant-Scoped Member Management Endpoints
router.get(
  '/members',
  requireOrgContext,
  orgController.getMembers
);

router.patch(
  '/members/:memberId/role',
  requireOrgContext,
  checkOrgRole('OWNER', 'MANAGER'),
  validate(updateMemberRoleSchema),
  orgController.updateRole
);

router.patch(
  '/members/:memberId/status',
  requireOrgContext,
  checkOrgRole('OWNER', 'MANAGER'),
  validate(updateMemberStatusSchema),
  orgController.updateStatus
);

export default router;