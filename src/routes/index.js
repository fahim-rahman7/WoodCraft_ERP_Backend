import express from 'express';
import authRoutes from './auth/index.js';
import orgRoutes from './organization/index.js';
import membershipRoutes from './membership/index.js';
import billingRoutes from './billing/index.js';


const router = express.Router();

router.use('/auth', authRoutes);
router.use('/organizations', orgRoutes);
router.use('/memberships', membershipRoutes);
router.use('/billing', billingRoutes);
export default router;