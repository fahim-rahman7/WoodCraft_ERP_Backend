import { ApiResponse } from "../../../utils/apiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import * as bomService from "./bom.service.js";

export const createBOM = asyncHandler(async (req, res) => {
  const bom = await bomService.createBOMService(
    req.organizationId,
    req.user.id,
    req.body
  );
  new ApiResponse(201, "BOM created successfully", bom).send(res);
});

export const getAllBOMs = asyncHandler(async (req, res) => {
  const boms = await bomService.getAllBOMsService(req.organizationId, req.query);
  new ApiResponse(200, "BOMs fetched successfully", boms).send(res);
});

export const getSingleBOM = asyncHandler(async (req, res) => {
  const bom = await bomService.getSingleBOMService(req.organizationId, req.params.id);
  new ApiResponse(200, "BOM details fetched successfully", bom).send(res);
});

export const updateBOM = asyncHandler(async (req, res) => {
  const bom = await bomService.updateBOMService(
    req.organizationId,
    req.params.id,
    req.body
  );
  new ApiResponse(200, "BOM updated successfully", bom).send(res);
});

export const deleteBOM = asyncHandler(async (req, res) => {
  const bom = await bomService.deleteBOMService(req.organizationId, req.params.id);
  new ApiResponse(200, "BOM deactivated successfully", bom).send(res);
});