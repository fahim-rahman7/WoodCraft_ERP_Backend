import express, { Router } from 'express';
import * as subController from '../../modules/subscription/subscription.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { requireOrgContext, checkOrgRole } from '../../middlewares/org.middleware.js';
import { createCheckoutSchema } from '../../modules/subscription/subscription.validation.js';

const router = Router();

// Middleware to parse urlencoded form data posted directly from SSLCommerz servers
const urlencodedParser = express.urlencoded({ extended: true });

// SSLCommerz Gateway Callback Endpoints (Public POST routes)
router.post('/success', urlencodedParser, subController.paymentSuccess);
router.post('/fail', urlencodedParser, subController.paymentFail);
router.post('/cancel', urlencodedParser, subController.paymentCancel);
router.post('/ipn', urlencodedParser, subController.paymentIPN);

// Protected Tenant Billing Endpoints
router.use(protect);

router.post(
  '/checkout',
  requireOrgContext,
  checkOrgRole('OWNER'),
  validate(createCheckoutSchema),
  subController.createCheckout
);

export default router;