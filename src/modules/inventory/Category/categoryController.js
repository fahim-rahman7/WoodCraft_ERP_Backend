import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../utils/apiResponse.js";
import * as categoryService from "./categoryService.js";

export const create = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(
    req.organizationId,
    req.body,
  );
  new ApiResponse(201, "Category created successfully", category).send(res);
});

export const getAll = asyncHandler(async (req, res) => {
  const result = await categoryService.getCategories(
    req.organizationId,
    req.categoryQuery,
  );
  new ApiResponse(200, "Categories retrieved successfully", result).send(res);
});

export const getOne = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(
    req.organizationId,
    req.params.id,
  );
  new ApiResponse(200, "Category retrieved successfully", category).send(res);
});

export const update = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(
    req.organizationId,
    req.params.id,
    req.body,
  );
  new ApiResponse(200, "Category updated successfully", category).send(res);
});

export const remove = asyncHandler(async (req, res) => {
  const category = await categoryService.deleteCategory(
    req.organizationId,
    req.params.id,
  );
  new ApiResponse(200, "Category deactivated successfully", category).send(res);
});
 