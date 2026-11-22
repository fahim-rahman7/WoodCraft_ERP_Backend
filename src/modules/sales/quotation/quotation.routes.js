import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireOrgContext, checkOrgRole } from '../../../middlewares/org.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as quotationController from './quotation.controller.js';
import {
  createQuotationSchema,
  updateQuotationSchema,
  quotationDecisionSchema,
  quotationIdParamSchema,
} from './quotation.validation.js';

const router = Router();

router.use(protect, requireOrgContext, checkOrgRole('OWNER', 'MANAGER'));

router
  .route('/')
  .post(
    validate(createQuotationSchema),
    quotationController.createQuotation
  )
  .get(quotationController.getQuotations);

router
  .route('/:id')
  .get(
    validate(quotationIdParamSchema, 'params'),
    quotationController.getQuotationById
  )
  .patch(
    validate(quotationIdParamSchema, 'params'),
    validate(updateQuotationSchema),
    quotationController.updateQuotation
  );

router.patch(
  '/:id/send',
  validate(quotationIdParamSchema, 'params'),
  quotationController.sendQuotation
);

router.patch(
  '/:id/decision',
  validate(quotationIdParamSchema, 'params'),
  validate(quotationDecisionSchema),
  quotationController.quotationDecision
);

export default router;