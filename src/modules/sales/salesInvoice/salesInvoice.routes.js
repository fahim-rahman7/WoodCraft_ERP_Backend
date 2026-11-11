import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireOrgContext, checkOrgRole } from '../../../middlewares/org.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as salesInvoiceController from './salesInvoice.controller.js';
import {
  createSalesInvoiceSchema,
  salesInvoiceIdParamSchema,
} from './salesInvoice.validation.js';

const router = Router();

router.use(protect, requireOrgContext, checkOrgRole('OWNER', 'MANAGER'));

router
  .route('/')
  .post(validate(createSalesInvoiceSchema), salesInvoiceController.createSalesInvoice)
  .get(salesInvoiceController.getSalesInvoices);

router
  .route('/:id')
  .get(validate(salesInvoiceIdParamSchema, 'params'), salesInvoiceController.getSalesInvoiceById);

router.patch(
  '/:id/issue',
  validate(salesInvoiceIdParamSchema, 'params'),
  salesInvoiceController.issueSalesInvoice
);

export default router;