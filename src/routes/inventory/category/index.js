import { Router } from 'express';
import * as categoryController from '../../../modules/inventory/Category/categoryController.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireOrgContext, checkOrgRole } from '../../../middlewares/org.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import {
  idParamSchema,
  createCategorySchema,
  updateCategorySchema,
  listCategoryQuerySchema,
} from './categoryValidation.js';

const router = Router();

router.use(protect, requireOrgContext);

router.post(
  '/',
  checkOrgRole('OWNER', 'MANAGER'),
  validate(createCategorySchema),
  categoryController.create
);

router.get('/', validate(listCategoryQuerySchema, 'query'), categoryController.getAll);

router.get('/:id', validate(idParamSchema, 'params'), categoryController.getOne);

router.patch(
  '/:id',
  checkOrgRole('OWNER', 'MANAGER'),
  validate(idParamSchema, 'params'),
  validate(updateCategorySchema),
  categoryController.update
);

router.delete(
  '/:id',
  checkOrgRole('OWNER', 'MANAGER'),
  validate(idParamSchema, 'params'),
  categoryController.remove
);

export default router;