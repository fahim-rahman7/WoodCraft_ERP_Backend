import express from 'express';
import authRoutes from './auth/index.js';
import orgRoutes from './organization/index.js';
import membershipRoutes from './membership/index.js';
import billingRoutes from './billing/index.js';
import inventoryRoutes from './inventory/index.js';
import productionRoutes from './production/index.js';
import invitationRoutes from './invitation/index.js';
import procurementRoutes from './procurement/index.js';
import dashboardRoutes from './dashboard/index.js';
import salesRoutes from './sales/index.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/organizations', orgRoutes);
router.use('/memberships', membershipRoutes);
router.use('/billing', billingRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/invitation', invitationRoutes);
router.use('/production', productionRoutes);
router.use('/procurement', procurementRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/sales', salesRoutes);



export default router;
