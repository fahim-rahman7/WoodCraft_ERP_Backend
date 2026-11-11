import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiResponse } from '../../../utils/apiResponse.js';
import * as customerService from './customer.service.js';

export const createCustomer = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const userId = req.user.id;

  const customer = await customerService.createCustomerService(organizationId, userId, req.body);

  new ApiResponse(201, 'Customer created successfully', customer).send(res);
});

export const getCustomers = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const result = await customerService.getCustomersService(organizationId, req.query);

  new ApiResponse(200, 'Customers retrieved successfully', result).send(res);
});

export const getCustomerById = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const customer = await customerService.getCustomerByIdService(organizationId, req.params.id);

  new ApiResponse(200, 'Customer details retrieved successfully', customer).send(res);
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const customer = await customerService.updateCustomerService(
    organizationId,
    req.params.id,
    req.body
  );

  new ApiResponse(200, 'Customer updated successfully', customer).send(res);
});