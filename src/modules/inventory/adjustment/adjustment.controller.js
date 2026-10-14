import { ApiResponse } from "../../../utils/apiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { adjustmentListServices, createAdjustmentServices } from "./adjustment.services.js";

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


// ------adjustment list
export const getAdjustmentList = asyncHandler(async(req, res)=>{
  const adjustmentList = await adjustmentListServices(req.organizationId, req.query)

  new ApiResponse(201, "All Stock adjustment get successfully", adjustmentList).send(
    res,
  );
})
