import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import * as subService from './subscription.service.js';

export const createCheckout = asyncHandler(async (req, res) => {
  const gatewayUrl = await subService.initiateSSLCommerzPayment(
    req.organizationId,
    req.user,
    req.body
  );
  new ApiResponse(200, 'SSLCommerz session initialized', { gatewayUrl }).send(res);
});

export const paymentSuccess = asyncHandler(async (req, res) => {
  const { val_id: valId } = req.body; // SSLCommerz posts form data to success_url
  const { tranId, orgId, plan } = req.query;

  await subService.verifyAndFinalizePayment(tranId, valId, orgId, plan);

  const frontendRedirect = `${process.env.FRONTEND_URL}/dashboard?payment=success`;
  res.redirect(frontendRedirect);
});

export const paymentFail = asyncHandler(async (req, res) => {
  const { tranId } = req.query;
  await subService.handleFailedTransaction(tranId, 'FAILED');

  const frontendRedirect = `${process.env.FRONTEND_URL}/billing?payment=failed`;
  res.redirect(frontendRedirect);
});

export const paymentCancel = asyncHandler(async (req, res) => {
  const { tranId } = req.query;
  await subService.handleFailedTransaction(tranId, 'CANCELLED');

  const frontendRedirect = `${process.env.FRONTEND_URL}/billing?payment=cancelled`;
  res.redirect(frontendRedirect);
});

export const paymentIPN = asyncHandler(async (req, res) => {
  const { tran_id: tranId, val_id: valId, status } = req.body;

  if (status === 'VALID' || status === 'VALIDATED') {
    const sub = await Subscription.findOne({ tranId });
    if (sub && sub.status !== 'ACTIVE') {
      await subService.verifyAndFinalizePayment(tranId, valId, sub.organizationId, sub.plan);
    }
  }

  res.status(200).json({ status: 'IPN Received' });
});