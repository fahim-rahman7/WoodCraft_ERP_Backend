import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiResponse } from '../../../utils/apiResponse.js';
import * as goodsReceiptService from './goodsReceipt.service.js';

export const createGoodsReceipt = asyncHandler(async (req, res) => {
  const goodsReceipt = await goodsReceiptService.createGoodsReceipt(
    req.organizationId,
    req.user.id,
    req.body
  );

  new ApiResponse(201, 'Goods Receipt created successfully (DRAFT)', goodsReceipt).send(res);
});

export const getGoodsReceipts = asyncHandler(async (req, res) => {
  const receipts = await goodsReceiptService.getGoodsReceipts(
    req.organizationId,
    req.query
  );

  new ApiResponse(200, 'Goods Receipts fetched successfully', receipts).send(res);
});

export const getGoodsReceiptById = asyncHandler(async (req, res) => {
  const goodsReceipt = await goodsReceiptService.getGoodsReceiptById(
    req.organizationId,
    req.params.id
  );

  new ApiResponse(200, 'Goods Receipt details fetched successfully', goodsReceipt).send(res);
});

export const receiveGoodsReceipt = asyncHandler(async (req, res) => {
  const goodsReceipt = await goodsReceiptService.receiveGoodsReceipt(
    req.organizationId,
    req.user.id,
    req.params.id
  );

  new ApiResponse(200, 'Goods Receipt marked as RECEIVED and Stock updated', goodsReceipt).send(res);
});