import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireOrgContext, checkOrgRole } from '../../../middlewares/org.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as supplierController from './supplier.controller.js';
import {
  createSupplierSchema,
  updateSupplierSchema,
  supplierIdParamSchema,
} from './supplier.validation.js';

const router = Router();

router.use(protect, requireOrgContext);

router
  .route('/')
  .post(
    checkOrgRole('OWNER', 'MANAGER'),
    validate(createSupplierSchema),
    supplierController.createSupplier
  )
  .get(supplierController.getSuppliers);

router
  .route('/:id')
  .get(
    validate(supplierIdParamSchema, 'params'),
    supplierController.getSupplierById
  )
  .patch(
    checkOrgRole('OWNER', 'MANAGER'),
    validate(supplierIdParamSchema, 'params'),
    validate(updateSupplierSchema),
    supplierController.updateSupplier
  )
  .delete(
    checkOrgRole('OWNER', 'MANAGER'),
    validate(supplierIdParamSchema, 'params'),
    supplierController.deleteSupplier
  );

export default router;