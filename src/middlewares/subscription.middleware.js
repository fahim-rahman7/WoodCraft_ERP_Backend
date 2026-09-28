import { AppError } from '../utils/appError.js';
import { Organization } from '../modules/organization/organization.model.js';

export const requireActiveSubscription = async (req, res, next) => {
  if (!req.organizationId) {
    return next(new AppError('Organization context ID is required', 400));
  }

  const org = await Organization.findById(req.organizationId).select('subscriptionStatus');

  if (!org || org.subscriptionStatus !== 'ACTIVE') {
    return next(
      new AppError(
        'Active subscription required. Please upgrade your plan to access ERP features.',
        402
      )
    );
  }

  next();
};