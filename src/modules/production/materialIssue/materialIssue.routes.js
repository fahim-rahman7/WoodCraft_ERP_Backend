import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireOrgContext } from '../../../middlewares/org.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as materialIssueController from './materialIssue.controller.js';
import { createMaterialIssueSchema } from './materialIssue.validation.js';

const router = Router();

router.use(protect, requireOrgContext);

router
  .route('/')
  .post(validate(createMaterialIssueSchema), materialIssueController.createMaterialIssue)
  .get(materialIssueController.getMaterialIssues);

router.route('/:id').get(materialIssueController.getMaterialIssueById);

// Material Issue কনফার্ম করার এনডপয়েন্ট
router.patch('/:id/issue', materialIssueController.issueMaterial);

export default router;