import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../utils/apiResponse.js";
import * as categoryService from "./category.service.js";

export const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategoryService(
    req.organizationId,
    req.body
  );
  new ApiResponse(201, "Category created successfully", category).send(res);
});

export const getAllCategories = asyncHandler(async (req, res) => {
  const categories = updates = await categoryService.getAllCategoriesService(
    req.organizationId,
    req.query
  );
  new ApiResponse(200, "Categories fetched successfully", categories).send(res);
});

export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryByIdService(
    req.params.id,
    req.organizationId
  );
  new ApiResponse(200, "Category details fetched successfully", category).send(res);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategoryService(
    req.params.id,
    req.organizationId,
    req.body
  );
  new ApiResponse(200, "Category updated successfully", category).send(res);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const result = await categoryService.deleteCategoryService(
    req.params.id,
    req.organizationId
  );
  new ApiResponse(200, "Category deleted successfully", result).send(res);
});