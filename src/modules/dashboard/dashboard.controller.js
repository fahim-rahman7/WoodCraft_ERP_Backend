import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import * as dashboardService from './dashboard.service.js';

export const getOwnerDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getOwnerDashboardData(req.organizationId);
  new ApiResponse(200, 'Owner dashboard data retrieved successfully', data).send(res);
});

export const getManagerDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getManagerDashboardData(req.organizationId);
  new ApiResponse(200, 'Manager dashboard data retrieved successfully', data).send(res);
});

export const getHrDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getHrDashboardData(req.organizationId);
  new ApiResponse(200, 'HR dashboard data retrieved successfully', data).send(res);
});