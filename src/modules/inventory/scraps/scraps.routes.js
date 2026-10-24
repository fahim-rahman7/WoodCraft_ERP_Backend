import { Router } from "express";
import { protect } from "../../../middlewares/auth.middleware.js";
import {
  checkOrgRole,
  requireOrgContext,
} from "../../../middlewares/org.middleware.js";
import { validate } from "../../../middlewares/validate.middleware.js";
import * as scrapsController from "./scraps.controller.js";
import { createScrapsSchema } from "./scraps.validation.js";

const router = Router();

router.use(protect, requireOrgContext, checkOrgRole("OWNER", "MANAGER"));

// ------create new scraps
router.post("/", validate(createScrapsSchema), scrapsController.createScraps);

export default router;
