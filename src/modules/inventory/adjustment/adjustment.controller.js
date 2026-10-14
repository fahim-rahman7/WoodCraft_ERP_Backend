import { ApiResponse } from "../../../utils/apiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import {
  adjustmentListServices,
  approveAdjustmentServices,
  cancelAdjustmentServices,
  createAdjustmentServices,
  getSingleAdjustmentServices,
} from "./adjustment.services.js";

// -----create new adjustment
export const createAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await createAdjustmentServices(
    req.organizationId,
    req.user.id,
    req.body,
  );

  new ApiResponse(
    201,
    "Stock adjustment created successfully",
    adjustment,
  ).send(res);
});

// ------adjustment list
export const getAdjustmentList = asyncHandler(async (req, res) => {
  const adjustmentList = await adjustmentListServices(
    req.organizationId,
    req.query,
  );

  new ApiResponse(
    201,
    "All Stock adjustment get successfully",
    adjustmentList,
  ).send(res);
});

// ------get single adjustment
export const getSingleAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await getSingleAdjustmentServices(
    req.params.id,
    req.organizationId,
  );

  new ApiResponse(
    200,
    "Stock adjustment fetched successfully",
    adjustment,
  ).send(res);
});

// ------approve adjustment
export const approveAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await approveAdjustmentServices(
    req.params.id,
    req.organizationId,
    req.user.id,
  );

  new ApiResponse(
    200,
    "Stock adjustment approved successfully",
    adjustment,
  ).send(res);
});

// ------cancel adjustment
export const cancelAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await cancelAdjustmentServices(
    req.params.id,
    req.organizationId,
  );

  new ApiResponse(
    200,
    "Stock adjustment cancelled successfully",
    adjustment,
  ).send(res);
});
