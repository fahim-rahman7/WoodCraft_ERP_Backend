import { Router } from 'express';
import { protect } from '../../middlewares/auth.middleware.js';
import { requireOrgContext, checkOrgRole } from '../../middlewares/org.middleware.js';
import * as dashboardController from '../../modules/dashboard/dashboard.controller.js';

const router = Router();

// Base middleware: Authentication & Organization Context Required for all dashboard routes
router.use(protect, requireOrgContext);

// Owner Dashboard (Only OWNER role)
router.get(
  '/owner',
  checkOrgRole('OWNER'),
  dashboardController.getOwnerDashboard
);

// Manager Dashboard (OWNER or MANAGER roles)
router.get(
  '/manager',
  checkOrgRole('OWNER', 'MANAGER'),
  dashboardController.getManagerDashboard
);

// HR Dashboard (OWNER or HR roles)
router.get(
  '/hr',
  checkOrgRole('OWNER', 'HR'),
  dashboardController.getHrDashboard
);

export default router;