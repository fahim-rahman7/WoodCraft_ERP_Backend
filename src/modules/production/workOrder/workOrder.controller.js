import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiResponse } from '../../../utils/apiResponse.js';
import * as workOrderService from './workOrder.service.js';

export const createWorkOrder = asyncHandler(async (req, res) => {
  const workOrder = await workOrderService.createWorkOrder(
    req.organizationId,
    req.user.id,
    req.body
  );
  new ApiResponse(201, 'Work Order created successfully', workOrder).send(res);
});

export const getWorkOrders = asyncHandler(async (req, res) => {
  const workOrders = await workOrderService.getWorkOrders(req.organizationId, req.query);
  new ApiResponse(200, 'Work orders retrieved successfully', workOrders).send(res);
});

export const getWorkOrderById = asyncHandler(async (req, res) => {
  const workOrder = await workOrderService.getWorkOrderById(req.organizationId, req.params.id);
  new ApiResponse(200, 'Work order retrieved successfully', workOrder).send(res);
});

export const startWorkOrder = asyncHandler(async (req, res) => {
  const workOrder = await workOrderService.startWorkOrder(req.organizationId, req.params.id);
  new ApiResponse(200, 'Work order started successfully', workOrder).send(res);
});

export const updateWorkOrderProgress = asyncHandler(async (req, res) => {
  const workOrder = await workOrderService.updateWorkOrderProgress(
    req.organizationId,
    req.params.id,
    req.body
  );
  new ApiResponse(200, 'Work order progress updated successfully', workOrder).send(res);
});

export const cancelWorkOrder = asyncHandler(async (req, res) => {
  const workOrder = await workOrderService.cancelWorkOrder(req.organizationId, req.params.id);
  new ApiResponse(200, 'Work order cancelled successfully', workOrder).send(res);
});