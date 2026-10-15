import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireOrgContext, checkOrgRole } from '../../../middlewares/org.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as qiController from './qualityInspection.controller.js';
import {
  createQualityInspectionSchema,
  qualityInspectionIdParamSchema,
} from './qualityInspection.validation.js';

const router = Router();

router.use(protect, requireOrgContext);

router
  .route('/')
  .post(
    checkOrgRole('OWNER', 'MANAGER'),
    validate(createQualityInspectionSchema),
    qiController.createQualityInspection
  )
  .get(qiController.getQualityInspections);

router.post(
  '/:id/inspect',
  checkOrgRole('OWNER', 'MANAGER'),
  validate(qualityInspectionIdParamSchema, 'params'),
  qiController.inspectQualityInspection
);

router.post(
  '/:id/cancel',
  checkOrgRole('OWNER', 'MANAGER'),
  validate(qualityInspectionIdParamSchema, 'params'),
  qiController.cancelQualityInspection
);

router
  .route('/:id')
  .get(validate(qualityInspectionIdParamSchema, 'params'), qiController.getQualityInspectionById);

export default router;