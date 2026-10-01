import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiResponse } from '../../../utils/apiResponse.js';
import * as stockService from './stock.service.js';

export const getStockSummary = asyncHandler(async (req, res) => {
  const stocks = await stockService.getStockSummary(req.organizationId, req.query);

  new ApiResponse(200, 'Stock summary fetched successfully', stocks).send(res);
});