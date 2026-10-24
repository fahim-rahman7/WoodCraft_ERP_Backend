import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiResponse } from '../../../utils/apiResponse.js';
import * as purchaseService from './purchase.service.js';

export const createPurchaseOrder = asyncHandler(async (req, res) => {
  const po = await purchaseService.createPurchaseOrder(req.organizationId, req.user.id, req.body);
  new ApiResponse(201, 'Purchase Order created successfully (DRAFT)', po).send(res);
});

export const getPurchaseOrders = asyncHandler(async (req, res) => {
  const pos = await purchaseService.getPurchaseOrders(req.organizationId, req.query);
  new ApiResponse(200, 'Purchase Orders fetched successfully', pos).send(res);
});

export const getPurchaseOrderById = asyncHandler(async (req, res) => {
  const po = await purchaseService.getPurchaseOrderById(req.organizationId, req.params.id);
  new ApiResponse(200, 'Purchase Order details fetched successfully', po).send(res);
});

export const updatePurchaseOrder = asyncHandler(async (req, res) => {
  const po = await purchaseService.updatePurchaseOrder(
    req.organizationId,
    req.params.id,
    req.body
  );
  new ApiResponse(200, 'Purchase Order updated successfully', po).send(res);
});

export const approvePurchaseOrder = asyncHandler(async (req, res) => {
  const po = await purchaseService.approvePurchaseOrder(req.organizationId, req.params.id);
  new ApiResponse(200, 'Purchase Order approved successfully', po).send(res);
});

export const cancelPurchaseOrder = asyncHandler(async (req, res) => {
  const po = await purchaseService.cancelPurchaseOrder(req.organizationId, req.params.id);
  new ApiResponse(200, 'Purchase Order cancelled successfully', po).send(res);
});