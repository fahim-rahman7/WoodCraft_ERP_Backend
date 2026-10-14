import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireOrgContext, checkOrgRole } from '../../../middlewares/org.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as purchaseController from './purchase.controller.js';
import {
  createPurchaseSchema,
  updatePurchaseSchema,
  purchaseIdParamSchema,
} from './purchase.validation.js';

const router = Router();

router.use(protect, requireOrgContext);

router
  .route('/')
  .post(
    checkOrgRole('OWNER', 'MANAGER'),
    validate(createPurchaseSchema),
    purchaseController.createPurchaseOrder
  )
  .get(purchaseController.getPurchaseOrders);

router.post(
  '/:id/approve',
  checkOrgRole('OWNER', 'MANAGER'),
  validate(purchaseIdParamSchema, 'params'),
  purchaseController.approvePurchaseOrder
);

router.post(
  '/:id/cancel',
  checkOrgRole('OWNER', 'MANAGER'),
  validate(purchaseIdParamSchema, 'params'),
  purchaseController.cancelPurchaseOrder
);

router
  .route('/:id')
  .get(validate(purchaseIdParamSchema, 'params'), purchaseController.getPurchaseOrderById)
  .patch(
    checkOrgRole('OWNER', 'MANAGER'),
    validate(purchaseIdParamSchema, 'params'),
    validate(updatePurchaseSchema),
    purchaseController.updatePurchaseOrder
  );

export default router;