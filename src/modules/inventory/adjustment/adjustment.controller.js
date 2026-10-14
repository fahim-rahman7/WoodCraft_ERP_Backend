import { ApiResponse } from "../../../utils/apiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { createAdjustmentServices } from "./adjustment.services.js";

// -----create new adjustment
export const createAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await createAdjustmentServices(
    req.organizationId,
    req.user.id,
    req.body,
  );

  new ApiResponse(201, "Stock adjustment created successfully", adjustment).send(
    res,
  );
});
