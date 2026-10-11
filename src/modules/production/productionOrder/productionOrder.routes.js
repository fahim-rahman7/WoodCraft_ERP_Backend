import { Router } from "express";
import { protect } from "../../../middlewares/auth.middleware.js";
import { checkOrgRole, requireOrgContext } from "../../../middlewares/org.middleware.js";
import { validate } from "../../../middlewares/validate.middleware.js";
import * as productionOrderController from "./productionOrder.controller.js";
import { createProductionOrderSchema, idParamSchema } from "./productionOrder.validation.js";

const router = Router();

// সব রাউটের জন্য Authentication এবং Organization Context চেক করা হবে
router.use(protect, requireOrgContext, checkOrgRole("OWNER", "MANAGER", "PRODUCTION_MANAGER"));

// Create new Production Order
router.post(
  "/",
  validate(createProductionOrderSchema, "body"),
  productionOrderController.createProductionOrder
);

// Get list of Production Orders (with optional query filters)
router.get(
  "/",
  productionOrderController.getProductionOrders
);

// Get single Production Order details
router.get(
  "/:id",
  validate(idParamSchema, "params"),
  productionOrderController.getProductionOrderById
);

// Start Production
router.post(
  "/:id/start",
  validate(idParamSchema, "params"),
  productionOrderController.startProduction
);

// Complete Production
router.post(
  "/:id/complete",
  validate(idParamSchema, "params"),
  productionOrderController.completeProduction
);

export default router;