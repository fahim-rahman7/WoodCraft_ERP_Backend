import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { checkOrgRole, requireOrgContext } from '../../../middlewares/org.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as warehouseController from './warehouse.controller.js';
import { createWarehouseSchema, updateWarehouseSchema } from './warehouse.validation.js';

const router = Router();

router.use(protect, requireOrgContext,checkOrgRole("OWNER", "MANAGER"),);

router
  .route('/')
  .post(validate(createWarehouseSchema), warehouseController.createWarehouse)
  .get(warehouseController.getWarehouses);

router
  .route('/:id')
  .get(warehouseController.getWarehouseById)
  .patch(validate(updateWarehouseSchema), warehouseController.updateWarehouse)
  .delete(warehouseController.deleteWarehouse);

export default router;