import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireOrgContext, checkOrgRole } from '../../../middlewares/org.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as itemController from './item.controller.js';
import {
  createItemSchema,
  updateItemSchema,
  itemIdParamSchema,
} from './item.validation.js';

const router = Router();

router.use(protect, requireOrgContext);

router
  .route('/')
  .post(
    checkOrgRole('OWNER', 'MANAGER'),
    validate(createItemSchema),
    itemController.createItem
  )
  .get(itemController.getItems);

router
  .route('/:id')
  .get(
    validate(itemIdParamSchema, 'params'),
    itemController.getItemById
  )
  .patch(
    checkOrgRole('OWNER', 'MANAGER'),
    validate(itemIdParamSchema, 'params'),
    validate(updateItemSchema),
    itemController.updateItem
  )
  .delete(
    checkOrgRole('OWNER', 'MANAGER'),
    validate(itemIdParamSchema, 'params'),
    itemController.deleteItem
  );

export default router;