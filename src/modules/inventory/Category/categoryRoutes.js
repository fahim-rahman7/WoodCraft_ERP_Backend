import { Router } from 'express';
import * as categoryController from './categoryController.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireOrgContext, checkOrgRole } from '../../../middlewares/org.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { AppError } from '../../../utils/appError.js';
import {
  idParamSchema,
  createCategorySchema,
  updateCategorySchema,
  listCategoryQuerySchema,
} from './categoryValidation.js';

const router = Router();

// শুধু category র জন্য: :id ঠিক format এর কিনা দেখে
const checkId = (req, res, next) => {
  const result = idParamSchema.safeParse(req.params);
  if (!result.success) {
    return next(new AppError(result.error.issues[0]?.message || 'Invalid ID', 400));
  }
  next();
};

// শুধু category র জন্য: query পরিষ্কার করে req.categoryQuery তে রাখে (controller এটাই পড়ে)
const parseQuery = (req, res, next) => {
  const result = listCategoryQuerySchema.safeParse(req.query);
  if (!result.success) {
    return next(new AppError(result.error.issues[0]?.message || 'Invalid query', 400));
  }
  req.categoryQuery = result.data;
  next();
};

router.use(protect, requireOrgContext);

router.post('/', checkOrgRole('OWNER', 'MANAGER'), validate(createCategorySchema), categoryController.create);

router.get('/', parseQuery, categoryController.getAll);

router.get('/:id', checkId, categoryController.getOne);

router.patch(
  '/:id',
  checkOrgRole('OWNER', 'MANAGER'),
  checkId,
  validate(updateCategorySchema),
  categoryController.update
);

router.delete('/:id', checkOrgRole('OWNER', 'MANAGER'), checkId, categoryController.remove);

export default router;