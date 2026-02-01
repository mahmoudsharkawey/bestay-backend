import httpResponse from "../utils/httpResponse.js";
import httpError from "../utils/httpError.js";
import * as authService from "../services/authService.js";
import { signToken } from "../utils/jwt.js";

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
    if (!name || !email || !password)
      throw new Error("Name, email and password are required");

    const user = await authService.signUp({ name, email, password, phone, role });

    const token = signToken({ id: user.id, email: user.email, role: user.role });

    const data = {
      user: sanitizeUser(user),
      token,
    };

    httpResponse(req, res, 201, "User created successfully", data);
  } catch (err) {
    httpError(next, err, req, 400);
  }
};

export const signIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new Error("Email and password are required");

    const user = await authService.signIn({ email, password });

    const token = signToken({ id: user.id, email: user.email, role: user.role });

    const data = {
      user: sanitizeUser(user),
      token,
    };

    httpResponse(req, res, 200, "Signed in successfully", data);
  } catch (err) {
    httpError(next, err, req, 401);
  }
};

export const signOut = async (req, res, next) => {
  try {
    // If using cookies in future, clear them here (e.g. res.clearCookie('token'))
    httpResponse(req, res, 200, "Signed out successfully");
  } catch (err) {
    httpError(next, err, req, 500);
  }
};
