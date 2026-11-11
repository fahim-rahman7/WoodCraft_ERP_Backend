import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiResponse } from '../../../utils/apiResponse.js';
import * as salesInvoiceService from './salesInvoice.service.js';

export const createSalesInvoice = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const userId = req.user._id;

  const invoice = await salesInvoiceService.createSalesInvoiceService(organizationId, userId, req.body);
  new ApiResponse(201, 'Sales Invoice draft created successfully', invoice).send(res);
});

export const getSalesInvoices = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const result = await salesInvoiceService.getSalesInvoicesService(organizationId, req.query);

  new ApiResponse(200, 'Sales Invoices retrieved successfully', result).send(res);
});

export const getSalesInvoiceById = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const invoice = await salesInvoiceService.getSalesInvoiceByIdService(organizationId, req.params.id);

  new ApiResponse(200, 'Sales Invoice details retrieved successfully', invoice).send(res);
});

export const issueSalesInvoice = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const userId = req.user._id;

  const invoice = await salesInvoiceService.issueSalesInvoiceService(organizationId, userId, req.params.id);
  new ApiResponse(200, 'Sales Invoice issued successfully', invoice).send(res);
});