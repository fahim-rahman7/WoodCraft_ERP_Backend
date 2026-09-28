import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import * as authService from './auth.service.js';

export const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);
  
  new ApiResponse(201, 'User registered successfully', user).send(res);
});

export const verifyOTP = asyncHandler(async (req, res) => {
  await authService.verifyOTP(req.body);
  new ApiResponse(200, 'Email verified successfully. You can now login').send(res);
});

export const resendOTP = asyncHandler(async (req, res) => {
  await authService.resendOTP(req.body);
  new ApiResponse(200, 'A new OTP has been sent to your email').send(res);
});

export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.loginUser(req.body);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  new ApiResponse(200, 'Logged in successfully', { user, accessToken }).send(res);
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  const result = await authService.refreshAccessToken(refreshToken);

  new ApiResponse(200, 'Token refreshed successfully', result).send(res);
});

export const logout = asyncHandler(async (req, res) => {
  if (req.user?.id) {
    await authService.logoutUser(req.user.id);
  }
  res.clearCookie('refreshToken');

  new ApiResponse(200, 'Logged out successfully').send(res);
});