import { Router } from 'express';
import materialIssueRoutes from '../../modules/production/materialIssue/materialIssue.routes.js';
import bomRoutes from '../../modules/production/bom/bom.routes.js';
import productionRoutes from '../../modules/production/productionOrder/productionOrder.routes.js';
import workOrderRoutes from '../../modules/production/workOrder/workOrder.routes.js';

const router = Router();

router.use('/material-issues', materialIssueRoutes);
router.use('/bom', bomRoutes);
router.use('/production-orders', productionRoutes);
router.use('/work-orders', workOrderRoutes);

export default router;