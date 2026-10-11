import { Router } from 'express';
import materialIssueRoutes from '../../modules/production/materialIssue/materialIssue.routes.js';
import bomRoutes from '../../modules/production/bom/bom.routes.js';
import productionRoutes from '../../modules/production/productionOrder/productionOrder.routes.js';

const router = Router();

router.use('/material-issues', materialIssueRoutes);
router.use('/bom', bomRoutes);
router.use('/production-orders', productionRoutes);

export default router;