import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireOrgContext, checkOrgRole } from '../../../middlewares/org.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as salesOrderController from './salesOrder.controller.js';
import {
  createSalesOrderSchema,
  salesOrderIdParamSchema,
} from './salesOrder.validation.js';

const router = Router();

// All Sales Order routes require authentication, org context, and OWNER/MANAGER roles
router.use(protect, requireOrgContext, checkOrgRole('OWNER', 'MANAGER'));

router
  .route('/')
  .post(validate(createSalesOrderSchema), salesOrderController.createSalesOrder)
  .get(salesOrderController.getSalesOrders);

router
  .route('/:id')
  .get(validate(salesOrderIdParamSchema, 'params'), salesOrderController.getSalesOrderById);

router.patch(
  '/:id/confirm',
  validate(salesOrderIdParamSchema, 'params'),
  salesOrderController.confirmSalesOrder
);

router.patch(
  '/:id/cancel',
  validate(salesOrderIdParamSchema, 'params'),
  salesOrderController.cancelSalesOrder
);

export default router;