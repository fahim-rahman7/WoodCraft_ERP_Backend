import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiResponse } from '../../../utils/apiResponse.js';
import * as stockMovementService from './stockMovement.service.js';

export const getStockMovements = asyncHandler(async (req, res) => {
  const movements = await stockMovementService.getStockMovements(
    req.organizationId,
    req.query
  );

  new ApiResponse(200, 'Stock movements ledger fetched successfully', movements).send(res);
});