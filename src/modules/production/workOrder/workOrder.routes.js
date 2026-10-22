import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { checkOrgRole, requireOrgContext } from '../../../middlewares/org.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as workOrderController from './workOrder.controller.js';
import {
  createWorkOrderSchema,
  updateWorkOrderProgressSchema,
  workOrderIdParamsSchema,
} from './workOrder.validation.js';

const router = Router();

router.use(protect, requireOrgContext, checkOrgRole('OWNER', 'MANAGER'));

router.post('/', validate(createWorkOrderSchema), workOrderController.createWorkOrder);
router.get('/', workOrderController.getWorkOrders);
router.get('/:id', validate(workOrderIdParamsSchema, 'params'), workOrderController.getWorkOrderById);

router.patch('/:id/start', validate(workOrderIdParamsSchema, 'params'), workOrderController.startWorkOrder);
router.patch(
  '/:id/progress',
  validate(workOrderIdParamsSchema, 'params'),
  validate(updateWorkOrderProgressSchema),
  workOrderController.updateWorkOrderProgress
);
router.patch('/:id/cancel', validate(workOrderIdParamsSchema, 'params'), workOrderController.cancelWorkOrder);

export default router