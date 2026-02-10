import { Router } from "express";
import {
  authLimiter,
  passwordResetLimiter,
} from "../../middlewares/rateLimiterMiddleware.js";
import { validate } from "../../middlewares/validateMiddleware.js";
import {
  signUpSchema,
  signInSchema,
  forgotPasswordSchema,
  verifyResetCodeSchema,
  resetPasswordSchema,
  googleLoginSchema,
} from "../../validations/authValidation.js";
import {
  signUp,
  signIn,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  googleLogin,
} from "../../controllers/authController.js";

const router = Router();

router.post("/sign-up", validate(signUpSchema), signUp);
router.post("/sign-in", authLimiter, validate(signInSchema), signIn);
router.post(
  "/forgot-password",
  passwordResetLimiter,
  validate(forgotPasswordSchema),
  forgotPassword,
);
router.post(
  "/verify-reset-code",
  validate(verifyResetCodeSchema),
  verifyResetCode,
);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);
router.post("/google-login", validate(googleLoginSchema), googleLogin);

export default router;
