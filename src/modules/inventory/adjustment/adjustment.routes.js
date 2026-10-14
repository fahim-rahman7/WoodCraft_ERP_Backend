import { Router } from "express";
import { protect } from "../../../middlewares/auth.middleware.js";
import {
  checkOrgRole,
  requireOrgContext,
} from "../../../middlewares/org.middleware.js";
import { validate } from "../../../middlewares/validate.middleware.js";
import * as adjustmentController from "./adjustment.controller.js";
import {
  adjustmentIdParamsSchema,
  createAdjustmentSchema,
} from "./adjustment.validation.js";

const router = Router();

router.use(protect, requireOrgContext, checkOrgRole("OWNER", "MANAGER"));

// ------create new adjustment
router.post(
  "/",
  validate(createAdjustmentSchema),
  adjustmentController.createAdjustment,
);

// ---------get adjustment list
router.get("/", adjustmentController.getAdjustmentList);

// ---------get single adjustment
router.get(
  "/:id",
  validate(adjustmentIdParamsSchema, "params"),
  adjustmentController.getSingleAdjustment,
);

// ---------approve adjustment
router.post(
  "/:id/approve",
  validate(adjustmentIdParamsSchema, "params"),
  adjustmentController.approveAdjustment,
);

// ---------cancel adjustment
router.post(
  "/:id/cancel",
  validate(adjustmentIdParamsSchema, "params"),
  adjustmentController.cancelAdjustment,
);

export default router;
