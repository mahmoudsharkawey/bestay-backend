import httpResponse from "../utils/httpResponse.js";
import httpError from "../utils/httpError.js";
import * as authService from "../services/authService.js";
import { signToken } from "../utils/jwt.js";
import { getErrorStatusCode } from "../utils/errorStatusCode.js";

const sanitizeUser = (user) => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || null,
    role: user.role,
    createdAt: user.createdAt,
  };
};

export const signUp = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    const user = await authService.signUp({
      name,
      email,
      password,
      phone,
      role,
    });

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const data = {
      user: sanitizeUser(user),
      token,
    };

    httpResponse(req, res, 201, "User created successfully", data);
  } catch (err) {
    httpError(next, err, req, getErrorStatusCode(err, 400));
  }
};

export const signIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await authService.signIn({ email, password });

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const data = {
      user: sanitizeUser(user),
      token,
    };

    httpResponse(req, res, 200, "Signed in successfully", data);
  } catch (err) {
    httpError(next, err, req, getErrorStatusCode(err, 401));
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);
    httpResponse(req, res, 200, "Password reset email sent successfully");
  } catch (err) {
    httpError(next, err, req, getErrorStatusCode(err, 500));
  }
};

export const verifyResetCode = async (req, res, next) => {
  try {
    const { email, resetCode } = req.body;
    await authService.verifyResetCode(email, resetCode);
    httpResponse(req, res, 200, "Reset code verified successfully");
  } catch (err) {
    httpError(next, err, req, getErrorStatusCode(err, 400));
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;
    await authService.resetPassword(email, newPassword);
    httpResponse(req, res, 200, "Password reset successfully");
  } catch (err) {
    httpError(next, err, req, getErrorStatusCode(err, 400));
  }
};

export const googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return httpError(next, new Error("Google token is required"), req, 400);
    }

    const result = await authService.googleLogin(token);

    httpResponse(req, res, 200, "Google login successful", result);
  } catch (error) {
    httpError(next, error, req, 500);
  }
};
