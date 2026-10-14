import { Router } from "express";
import { protect } from "../../../middlewares/auth.middleware.js";
import { requireOrgContext, checkOrgRole } from "../../../middlewares/org.middleware.js";
import { validate } from "../../../middlewares/validate.middleware.js";
import * as categoryController from "./category.controller.js";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
} from "./category.validation.js";

const router = Router();

router.use(protect, requireOrgContext);

router
  .route("/")
  .post(
    checkOrgRole("OWNER", "MANAGER"),
    validate(createCategorySchema),
    categoryController.createCategory
  )
  .get(categoryController.getAllCategories);

router
  .route("/:id")
  .get(
    validate(categoryIdParamSchema, "params"),
    categoryController.getCategoryById
  )
  .patch(
    checkOrgRole("OWNER", "MANAGER"),
    validate(categoryIdParamSchema, "params"),
    validate(updateCategorySchema),
    categoryController.updateCategory
  )
  .delete(
    checkOrgRole("OWNER", "MANAGER"),
    validate(categoryIdParamSchema, "params"),
    categoryController.deleteCategory
  );

export default router;