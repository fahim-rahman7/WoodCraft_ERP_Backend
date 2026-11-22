import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireOrgContext, checkOrgRole } from '../../../middlewares/org.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as customerController from './customer.controller.js';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerIdParamSchema,
} from './customer.validation.js';

const router = Router();

// All customer routes require authentication and active organization context
router.use(protect, requireOrgContext, checkOrgRole('OWNER', 'MANAGER'));

router
  .route('/')
  .post(
    validate(createCustomerSchema),
    customerController.createCustomer
  )
  .get(customerController.getCustomers);

router
  .route('/:id')
  .get(
    validate(customerIdParamSchema, 'params'),
    customerController.getCustomerById
  )
  .patch(
    validate(customerIdParamSchema, 'params'),
    validate(updateCustomerSchema),
    customerController.updateCustomer
  );

export default router;