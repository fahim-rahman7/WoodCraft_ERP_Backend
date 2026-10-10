import { Router } from "express";
import { protect } from "../../../middlewares/auth.middleware.js";
import {
  checkOrgRole,
  requireOrgContext,
} from "../../../middlewares/org.middleware.js";
import { validate } from "../../../middlewares/validate.middleware.js";
import * as transferController from "./transfer.controller.js";
import {
  createTransferSchema,
  transferIdParamsSchema,
} from "./transfer.validation.js";

const router = Router();

router.use(protect, requireOrgContext, checkOrgRole("OWNER", "MANAGER"));

// ------create new transfer
router.post(
  "/",
  validate(createTransferSchema),
  transferController.createNewTransfer,
);

// -----transfer list with filter
router.get("/", transferController.getAllTransfer);

// ------single transfer with id
router.get(
  "/:id",
  validate(transferIdParamsSchema, "params"),
  transferController.getSingleTransfer,
);

// ------transfer approve
router.post(
  "/:id/approve",
  validate(transferIdParamsSchema, "params"),
  transferController.approveTransfer,
);

// ------transfer complete
router.post(
  "/:id/complete",
  validate(transferIdParamsSchema, "params"),
  transferController.completeTransfer,
);

// ------transfer cancel
router.post(
  "/:id/cancel",
  validate(transferIdParamsSchema, "params"),
  transferController.cancelTransfer,
);

export default router;
