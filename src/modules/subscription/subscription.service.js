import mongoose from 'mongoose';
import { sslcommerz } from '../../config/sslcommerz.js';
import { Subscription } from './subscription.model.js';
import { Organization } from '../organization/organization.model.js';
import { AppError } from '../../utils/appError.js';

const PLAN_PRICES = {
  PRO: 5000,       // Price in BDT
  ENTERPRISE: 15000,
};

export const initiateSSLCommerzPayment = async (orgId, user, { plan, cusPhone }) => {
  const organization = await Organization.findById(orgId);
  if (!organization) {
    throw new AppError('Organization not found', 404);
  }

  const amount = PLAN_PRICES[plan];
  if (!amount) {
    throw new AppError('Invalid subscription plan selected', 400);
  }

  const tranId = `TRANS_${orgId.toString().slice(-6)}_${Date.now()}`;
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';

  const data = {
    total_amount: amount,
    currency: 'BDT',
    tran_id: tranId,
    success_url: `${baseUrl}/api/v1/billing/success?tranId=${tranId}&orgId=${orgId}&plan=${plan}`,
    fail_url: `${baseUrl}/api/v1/billing/fail?tranId=${tranId}`,
    cancel_url: `${baseUrl}/api/v1/billing/cancel?tranId=${tranId}`,
    ipn_url: `${baseUrl}/api/v1/billing/ipn`,
    shipping_method: 'NO',
    product_name: `WoodCraft ERP ${plan} Plan Subscription`,
    product_category: 'Software Service',
    product_profile: 'non-physical-goods',
    cus_name: user.name || organization.name,
    cus_email: user.email,
    cus_add1: 'Dhaka',
    cus_city: 'Dhaka',
    cus_postcode: '1000',
    cus_country: 'Bangladesh',
    cus_phone: cusPhone,
  };

  const response = await sslcommerz.init(data);

  if (!response?.GatewayPageURL) {
    throw new AppError('Failed to initialize SSLCommerz gateway session', 500);
  }

  // Record pending transaction
  await Subscription.findOneAndUpdate(
    { organizationId: orgId },
    {
      tranId,
      status: 'PENDING',
      amount,
      currency: 'BDT',
    },
    { upsert: true }
  );

  return response.GatewayPageURL;
};

export const verifyAndFinalizePayment = async (tranId, valId, orgId, plan) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate order status with SSLCommerz servers
    const validationResponse = await sslcommerz.validate({ val_id: valId });

    if (
      validationResponse.status !== 'VALID' &&
      validationResponse.status !== 'VALIDATED'
    ) {
      throw new AppError('Payment validation failed with SSLCommerz provider', 400);
    }

    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1); // 30-day billing cycle

    const updatedSub = await Subscription.findOneAndUpdate(
      { organizationId: orgId },
      {
        valId,
        tranId,
        plan,
        status: 'ACTIVE',
        currentPeriodEnd,
      },
      { session, returnDocument: "after" }
    );

    await Organization.findByIdAndUpdate(
      orgId,
      { plan, subscriptionStatus: 'ACTIVE', subscriptionId: updatedSub._id, },
      { session }
    );

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const handleFailedTransaction = async (tranId, status) => {
  await Subscription.findOneAndUpdate(
    { tranId },
    { status: status === 'CANCELLED' ? 'CANCELLED' : 'EXPIRED' }
  );
};