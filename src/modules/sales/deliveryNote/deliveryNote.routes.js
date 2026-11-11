import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireOrgContext, checkOrgRole } from '../../../middlewares/org.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as deliveryNoteController from './deliveryNote.controller.js';
import {
  createDeliveryNoteSchema,
  deliveryNoteIdParamSchema,
} from './deliveryNote.validation.js';

const router = Router();

router.use(protect, requireOrgContext, checkOrgRole('OWNER', 'MANAGER'));

router
  .route('/')
  .post(validate(createDeliveryNoteSchema), deliveryNoteController.createDeliveryNote)
  .get(deliveryNoteController.getDeliveryNotes);

router
  .route('/:id')
  .get(validate(deliveryNoteIdParamSchema, 'params'), deliveryNoteController.getDeliveryNoteById);

router.patch(
  '/:id/dispatch',
  validate(deliveryNoteIdParamSchema, 'params'),
  deliveryNoteController.dispatchDeliveryNote
);

export default router;