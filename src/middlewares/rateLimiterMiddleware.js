import rateLimit from "express-rate-limit";
import httpResponse from "../utils/httpResponse.js";

// Global API limiter: 100 requests per 15 minutes per IP by default
export const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    return httpResponse(req, res, 429, "Too many requests, please try again later.");
  },
});

// Sign-in route limiter: tighter limits to protect authentication endpoints
export const authLimiter = rateLimit({
  windowMs: Number(process.env.SIGNIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.SIGNIN_RATE_LIMIT_MAX) || 5, // 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return httpResponse(req, res, 429, "Too many login attempts. Please try again later.");
  },
});

export default { apiLimiter, authLimiter };
