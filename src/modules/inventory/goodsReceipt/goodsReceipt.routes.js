import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireOrgContext } from '../../../middlewares/org.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as goodsReceiptController from './goodsReceipt.controller.js';
import { createGoodsReceiptSchema } from './goodsReceipt.validation.js';

const router = Router();

router.use(protect, requireOrgContext);

router
  .route('/')
  .post(validate(createGoodsReceiptSchema), goodsReceiptController.createGoodsReceipt)
  .get(goodsReceiptController.getGoodsReceipts);

router.route('/:id').get(goodsReceiptController.getGoodsReceiptById);

// GRN কনফার্ম/রিসিভ করার এনডপয়েন্ট
router.patch('/:id/receive', goodsReceiptController.receiveGoodsReceipt);

export default router;