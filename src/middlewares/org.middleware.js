import { Membership } from '../modules/membership/membership.model.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const requireOrgContext = asyncHandler(async (req, res, next) => {
  const orgId = req.headers['x-organization-id'] || req.params.orgId;

  if (!orgId) {
    throw new AppError('Organization context ID is required', 400);
  }

  const membership = await Membership.findOne({
    userId: req.user.id,
    organizationId: orgId,
    status: 'ACTIVE',
  });

  if (!membership) {
    throw new AppError('Access denied: You are not an active member of this organization', 403);
  }

  req.organizationId = orgId;
  req.membership = membership;
  next();
});

export const checkOrgRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.membership) {
      return next(new AppError('Organization context missing', 500));
    }

    if (!allowedRoles.includes(req.membership.role)) {
      return next(new AppError('Permission denied for your organization role', 403));
    }

    next();
  };
};