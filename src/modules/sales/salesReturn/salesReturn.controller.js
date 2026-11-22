import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiResponse } from '../../../utils/apiResponse.js';
import * as salesReturnService from './salesReturn.service.js';

export const createSalesReturn = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const userId = req.user._id;

  const salesReturn = await salesReturnService.createSalesReturnService(organizationId, userId, req.body);
  new ApiResponse(201, 'Sales Return request created successfully', salesReturn).send(res);
});

export const getSalesReturns = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const result = await salesReturnService.getSalesReturnsService(organizationId, req.query);

  new ApiResponse(200, 'Sales Returns retrieved successfully', result).send(res);
});

export const getSalesReturnById = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const salesReturn = await salesReturnService.getSalesReturnByIdService(organizationId, req.params.id);

  new ApiResponse(200, 'Sales Return details retrieved successfully', salesReturn).send(res);
});

export const approveSalesReturn = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const salesReturn = await salesReturnService.approveSalesReturnService(organizationId, req.params.id);

  new ApiResponse(200, 'Sales Return request approved successfully', salesReturn).send(res);
});

export const receiveSalesReturn = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const salesReturn = await salesReturnService.receiveSalesReturnService(organizationId, req.params.id, req.body);

  new ApiResponse(200, 'Physical goods received for sales return successfully', salesReturn).send(res);
});

export const inspectSalesReturn = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const userId = req.user._id;

  const salesReturn = await salesReturnService.inspectSalesReturnService(organizationId, userId, req.params.id, req.body);
  new ApiResponse(200, 'Sales Return inspection and disposition recorded successfully', salesReturn).send(res);
});

export const closeSalesReturn = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const salesReturn = await salesReturnService.closeSalesReturnService(organizationId, req.params.id);

  new ApiResponse(200, 'Sales Return closed successfully', salesReturn).send(res);
});