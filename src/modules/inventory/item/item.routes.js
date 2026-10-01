import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireOrgContext } from '../../../middlewares/org.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as itemController from './item.controller.js';
import { createItemSchema, updateItemSchema } from './item.validation.js';

const router = Router();

router.use(protect, requireOrgContext);

router
  .route('/')
  .post(validate(createItemSchema), itemController.createItem)
  .get(itemController.getItems);

router
  .route('/:id')
  .get(itemController.getItemById)
  .patch(validate(updateItemSchema), itemController.updateItem)
  .delete(itemController.deleteItem);

export default router;