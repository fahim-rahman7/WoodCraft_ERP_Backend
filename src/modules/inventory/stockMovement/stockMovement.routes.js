import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireOrgContext } from '../../../middlewares/org.middleware.js';
import * as stockMovementController from './stockMovement.controller.js';

const router = Router();

router.use(protect, requireOrgContext);

router.get('/', stockMovementController.getStockMovements);

export default router;