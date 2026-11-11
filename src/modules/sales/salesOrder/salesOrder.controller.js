import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiResponse } from '../../../utils/apiResponse.js';
import * as salesOrderService from './salesOrder.service.js';

export const createSalesOrder = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const userId = req.user.id;

  const salesOrder = await salesOrderService.createSalesOrderService(organizationId, userId, req.body);
  new ApiResponse(201, 'Sales Order draft created successfully', salesOrder).send(res);
});

export const getSalesOrders = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const result = await salesOrderService.getSalesOrdersService(organizationId, req.query);

  new ApiResponse(200, 'Sales Orders retrieved successfully', result).send(res);
});

export const getSalesOrderById = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const salesOrder = await salesOrderService.getSalesOrderByIdService(organizationId, req.params.id);

  new ApiResponse(200, 'Sales Order details retrieved successfully', salesOrder).send(res);
});

export const confirmSalesOrder = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const userId = req.user._id;

  const salesOrder = await salesOrderService.confirmSalesOrderService(organizationId, userId, req.params.id);
  new ApiResponse(200, 'Sales Order confirmed successfully', salesOrder).send(res);
});

export const cancelSalesOrder = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const salesOrder = await salesOrderService.cancelSalesOrderService(organizationId, req.params.id);

  newApiResponse(200, 'Sales Order cancelled successfully', salesOrder).send(res);
});