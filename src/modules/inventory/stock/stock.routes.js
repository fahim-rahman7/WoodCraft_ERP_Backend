import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireOrgContext } from '../../../middlewares/org.middleware.js';
import * as stockController from './stock.controller.js';

const router = Router();

router.use(protect, requireOrgContext);

router.get('/summary', stockController.getStockSummary);

export default router;