import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(4, 'Name must be at least 4 characters'),
  email: z.email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
    email: z.email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const verifyOtpSchema = z.object({
    email: z.email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
  });
  
export const resendOtpSchema = z.object({
    email: z.email('Invalid email address'),
  });