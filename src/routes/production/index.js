import { Router } from 'express';
import materialIssueRoutes from '../../modules/production/materialIssue/materialIssue.routes.js';

const router = Router();

router.use('/material-issues', materialIssueRoutes);

export default router;