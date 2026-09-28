import express from 'express';
import * as authController from '../../modules/auth/auth.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  loginSchema,
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
} from '../../modules/auth/auth.validation.js';

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOTP);
router.post('/resend-otp', validate(resendOtpSchema), authController.resendOTP);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', protect, authController.logout);

export default router;