import { ApiResponse } from "../../../utils/apiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import * as productionOrderService from "./productionOrder.service.js";

// Create new Production Order
export const createProductionOrder = asyncHandler(async (req, res) => {
  const order = await productionOrderService.createProductionOrder(
    req.organizationId,
    req.user.id,
    req.body
  );
  new ApiResponse(201, "Production Order created successfully", order).send(res);
});

// Get all Production Orders with optional filters
export const getProductionOrders = asyncHandler(async (req, res) => {
  const orders = await productionOrderService.getProductionOrders(
    req.organizationId,
    req.query
  );
  new ApiResponse(200, "Production Orders fetched successfully", orders).send(res);
});

// Get single Production Order by ID
export const getProductionOrderById = asyncHandler(async (req, res) => {
  const order = await productionOrderService.getProductionOrderById(
    req.organizationId,
    req.params.id
  );
  new ApiResponse(200, "Production Order details fetched successfully", order).send(res);
});

// Start Production
export const startProduction = asyncHandler(async (req, res) => {
  const order = await productionOrderService.startProduction(
    req.organizationId,
    req.params.id
  );
  new ApiResponse(200, "Production started successfully", order).send(res);
});

// Complete Production
export const completeProduction = asyncHandler(async (req, res) => {
  const order = await productionOrderService.completeProduction(
    req.organizationId,
    req.user.id,
    req.params.id
  );
  new ApiResponse(200, "Production completed successfully", order).send(res);
});