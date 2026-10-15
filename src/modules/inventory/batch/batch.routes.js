import { Router } from "express";
import { protect } from "../../../middlewares/auth.middleware.js";
import { requireOrgContext, checkOrgRole } from "../../../middlewares/org.middleware.js";
import { validate } from "../../../middlewares/validate.middleware.js";
import * as batchController from "./batch.controller.js";
import {
  createBatchSchema,
  updateBatchSchema,
  batchIdParamSchema,
} from "./batch.validation.js";

const router = Router();

router.use(protect, requireOrgContext);

router
  .route("/")
  .post(
    checkOrgRole("OWNER", "MANAGER"),
    validate(createBatchSchema),
    batchController.createBatch
  )
  .get(batchController.getAllBatches);

router
  .route("/:id")
  .get(
    validate(batchIdParamSchema, "params"),
    batchController.getBatchById
  )
  .patch(
    checkOrgRole("OWNER", "MANAGER"),
    validate(batchIdParamSchema, "params"),
    validate(updateBatchSchema),
    batchController.updateBatch
  )
  .delete(
    checkOrgRole("OWNER", "MANAGER"),
    validate(batchIdParamSchema, "params"),
    batchController.deleteBatch
  );

export default router;