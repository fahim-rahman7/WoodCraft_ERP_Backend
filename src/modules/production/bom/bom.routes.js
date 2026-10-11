import { Router } from "express";
import { protect } from "../../../middlewares/auth.middleware.js";
import { checkOrgRole, requireOrgContext } from "../../../middlewares/org.middleware.js";
import { validate } from "../../../middlewares/validate.middleware.js";
import * as bomController from "./bom.controller.js";
import {
  createBOMSchema,
  updateBOMSchema,
  idParamSchema,
  listBOMQuerySchema,
} from "./bom.validation.js";

const router = Router();

// Shob route e auth, org context ebong role check kora hobe
router.use(protect, requireOrgContext, checkOrgRole("OWNER", "MANAGER", "PRODUCTION_MANAGER"));

// Create new BOM
router.post(
  "/",
  validate(createBOMSchema, "body"),
  bomController.createBOM
);

// Get list of BOMs with filters & pagination
router.get(
  "/",
  validate(listBOMQuerySchema, "query"),
  bomController.getAllBOMs
);

// Get single BOM details
router.get(
  "/:id",
  validate(idParamSchema, "params"),
  bomController.getSingleBOM
);

// Update BOM
router.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateBOMSchema, "body"),
  bomController.updateBOM
);

// Soft delete BOM
router.delete(
  "/:id",
  validate(idParamSchema, "params"),
  bomController.deleteBOM
);

export default router;