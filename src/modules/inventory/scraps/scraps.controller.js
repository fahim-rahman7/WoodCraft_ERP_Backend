import { ApiResponse } from "../../../utils/apiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import {
  createScrapsServices,
  getSingleScrapsServices,
  scrapsListServices,
} from "./scraps.services.js";

// -----create scraps controller
export const createScraps = asyncHandler(async (req, res) => {
  const scrap = await createScrapsServices(
    req.organizationId,
    req.user.id,
    req.body,
  );

  new ApiResponse(201, "Scrap request created successfully", scrap).send(res);
});

// ------scraps list
export const getScrapsList = asyncHandler(async (req, res) => {
  const scrapsList = await scrapsListServices(req.organizationId, req.query);

  new ApiResponse(200, "All scraps get successfully", scrapsList).send(res);
});

// ------single scraps
export const getSingleScraps = asyncHandler(async (req, res) => {
  const scrap = await getSingleScrapsServices(req.params.id, req.organizationId);

  new ApiResponse(200, "Scrap fetched successfully", scrap).send(res);
});
