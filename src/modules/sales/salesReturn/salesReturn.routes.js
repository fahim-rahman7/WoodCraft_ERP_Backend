import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireOrgContext, checkOrgRole } from '../../../middlewares/org.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as salesReturnController from './salesReturn.controller.js';
import {
  createSalesReturnSchema,
  receiveSalesReturnSchema,
  inspectSalesReturnSchema,
  salesReturnIdParamSchema,
} from './salesReturn.validation.js';

const router = Router();

router.use(protect, requireOrgContext, checkOrgRole('OWNER', 'MANAGER'));

router
  .route('/')
  .post(validate(createSalesReturnSchema), salesReturnController.createSalesReturn)
  .get(salesReturnController.getSalesReturns);

router
  .route('/:id')
  .get(validate(salesReturnIdParamSchema, 'params'), salesReturnController.getSalesReturnById);

router.patch(
  '/:id/approve',
  validate(salesReturnIdParamSchema, 'params'),
  salesReturnController.approveSalesReturn
);

router.patch(
  '/:id/receive',
  validate(salesReturnIdParamSchema, 'params'),
  validate(receiveSalesReturnSchema),
  salesReturnController.receiveSalesReturn
);

router.patch(
  '/:id/inspect',
  validate(salesReturnIdParamSchema, 'params'),
  validate(inspectSalesReturnSchema),
  salesReturnController.inspectSalesReturn
);

router.patch(
  '/:id/close',
  validate(salesReturnIdParamSchema, 'params'),
  salesReturnController.closeSalesReturn
);

export default router;