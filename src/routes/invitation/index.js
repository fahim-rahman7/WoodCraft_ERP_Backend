import { Router } from 'express';
import { sendInvitation, acceptInvitation } from '../../modules/invitation/invitation.controller.js';
import { createInvitationSchema, acceptInvitationSchema } from '../../modules/invitation/invitation.validation.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { requireOrgContext, checkOrgRole } from '../../middlewares/org.middleware.js';
import { requireActiveSubscription } from '../../middlewares/subscription.middleware.js';

const router = Router();

// Route to send an invitation (Protected: requires auth, org context, active subscription, and authorized role)
router.post(
  '/organizations/:orgId/invitations',
  protect,
  requireOrgContext,
  requireActiveSubscription,
  checkOrgRole('OWNER', 'MANAGER', 'HR'),
  validate(createInvitationSchema),
  sendInvitation
);

// Route to accept an invitation (Public endpoint using secure token)
router.post(
  '/invitations/:token/accept',
  validate(acceptInvitationSchema),
  acceptInvitation
);

export default router;