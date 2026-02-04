import { Router } from "express";
import { authLimiter } from "../../middlewares/rateLimiterMiddleware.js";
import {
  signUp,
  signIn,
  forgotPassword,
  verifyResetCode,
  resetPassword,
} from "../../controllers/authController.js";

const router = Router();

router.post("/sign-up", signUp);
router.post("/sign-in", authLimiter, signIn);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);

export default router;
