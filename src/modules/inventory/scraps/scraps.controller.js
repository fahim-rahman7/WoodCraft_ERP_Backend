import { ApiResponse } from "../../../utils/apiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { createScrapsServices } from "./scraps.services.js";

// -----create scraps controller
export const createScraps = asyncHandler(async (req, res) => {
  const scrap = await createScrapsServices(
    req.organizationId,
    req.user.id,
    req.body,
  );

  new ApiResponse(201, "Scrap request created successfully", scrap).send(res);
});
