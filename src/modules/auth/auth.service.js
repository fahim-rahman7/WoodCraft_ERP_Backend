import argon2 from "argon2";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "./auth.model.js";
import { AppError } from "../../utils/appError.js";
import { sendOTP, sendResetPasswordEmail } from "../../utils/sendEmail.js";

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" },
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
};

const generate6DigitOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const verifyOTP = async ({ email, otp }) => {
  const user = await User.findOne({ email }).select("+otp +otpExpires");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.isVerified) {
    throw new AppError("Account is already verified", 400);
  }

  if (!user.otp || user.otp !== otp) {
    throw new AppError("Invalid OTP", 400);
  }

  if (user.otpExpires < new Date()) {
    throw new AppError("OTP has expired", 400);
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();
};

export const resendOTP = async ({ email }) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.isVerified) {
    throw new AppError("Account is already verified", 400);
  }

  const otp = generate6DigitOTP();
  user.otp = otp;
  user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  await sendOTP(email, otp);
};

export const registerUser = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("Email is already registered", 400);
  }

  const hashedPassword = await argon2.hash(password);
  const otp = generate6DigitOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    otp,
    otpExpires,
  });

  await sendOTP(email, otp);

  return { id: user._id, name: user.name, email: user.email };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isVerified) {
    throw new AppError("Please verify your email/OTP before logging in", 403);
  }

  const isPasswordValid = await argon2.verify(user.password, password);
  if (!isPasswordValid) {
    throw new AppError("Invalid Credential", 401);
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save();

  return {
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  };
};

export const refreshAccessToken = async (token) => {
  if (!token) {
    throw new AppError("Refresh token is required", 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw new AppError("Invalid or expired refresh token", 403);
  }

  const user = await User.findById(decoded.id).select("+refreshToken");

  if (!user || user.refreshToken !== token) {
    throw new AppError("Invalid or revoked refresh token", 403);
  }

  const newAccessToken = generateAccessToken(user);
  return { accessToken: newAccessToken };
};

export const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

export const forgetPassword = async ({ email }) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const resetPassToken = crypto.randomBytes(32).toString("hex");

  const resetPassTokenExpires = new Date(Date.now() + 15 * 60 * 1000); //15 mins

  user.resetPassToken = resetPassToken;
  user.resetPassTokenExpires = resetPassTokenExpires;

  // validateBeforeSave: false দেওয়ার কারণ হলো পাসওয়ার্ড বা অন্য ফিল্ড যেন আবার ভ্যালিডেশন ফেস না করে
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetPassToken}`;

  try {
    await sendResetPasswordEmail(email, resetUrl);
  } catch (error) {
    user.resetPassToken = null;
    user.resetPassTokenExpires = null;
    await user.save({ validateBeforeSave: false });

    throw new AppError("Email could not be sent. Please try again later", 500);
  }

  return {
    success: true,
    message: "Password reset link sent to email successfully",
  };
};

export const resetPassword = async ({ token, newPassword }) => {
  const user = await User.findOne({
    resetPassToken: token,
    resetPassTokenExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  const hashedPassword = await argon2.hash(newPassword);

  user.password = hashedPassword;
  user.resetPassToken = null;
  user.resetPassTokenExpires = null;

  await user.save();

  return {
    success: true,
    message: "Password reset successfull. Use your new password to login",
  };
};
