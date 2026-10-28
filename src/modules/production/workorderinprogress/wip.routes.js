import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { checkOrgRole, requireOrgContext } from '../../../middlewares/org.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as wipController from './wip.controller.js';
import {
  createWipSchema,
  optionalWipActionSchema,
  scrapWipSchema,
  updateWipProgressSchema,
  wipIdParamsSchema,
} from './wip.validation.js';

const router = Router();

// Authentication + Organization context + role check
router.use(protect, requireOrgContext, checkOrgRole('OWNER', 'MANAGER', 'STAFF'));

// Create a new WIP record (against an IN_PROGRESS work order)
router.post('/', validate(createWipSchema), wipController.createWip);

// List + aggregate summary (summary আগে রাখতে হবে যাতে '/:id' route এটা গ্রাস না করে)
router.get('/', wipController.getWips);
router.get('/summary', wipController.getWipSummary);

// Single WIP record
router.get('/:id', validate(wipIdParamsSchema, 'params'), wipController.getWipById);

// Lifecycle actions
router.patch(
  '/:id/start',
  validate(wipIdParamsSchema, 'params'),
  wipController.startWip
);

router.patch(
  '/:id/progress',
  validate(wipIdParamsSchema, 'params'),
  validate(updateWipProgressSchema),
  wipController.updateWipProgress
);

router.patch(
  '/:id/scrap',
  validate(wipIdParamsSchema, 'params'),
  validate(scrapWipSchema),
  wipController.scrapWip
);

router.patch(
  '/:id/hold',
  validate(wipIdParamsSchema, 'params'),
  validate(optionalWipActionSchema),
  wipController.holdWip
);

router.patch(
  '/:id/resume',
  validate(wipIdParamsSchema, 'params'),
  validate(optionalWipActionSchema),
  wipController.resumeWip
);

router.patch(
  '/:id/complete',
  validate(wipIdParamsSchema, 'params'),
  validate(optionalWipActionSchema),
  wipController.completeWip
);

router.patch(
  '/:id/cancel',
  validate(wipIdParamsSchema, 'params'),
  validate(optionalWipActionSchema),
  wipController.cancelWip
);

export default router;
