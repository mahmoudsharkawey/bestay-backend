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
} from "./auth.validation.js";
import {
  signUp,
  signIn,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  googleLogin,
} from "./auth.controller.js";

const router = Router();

/**
 * @swagger
 * /auth/sign-up:
 *   post:
 *     summary: Register a new user account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: Password1!
 *               phone:
 *                 type: string
 *                 example: "+201234567890"
 *               role:
 *                 type: string
 *                 enum: [USER, LANDLORD]
 *                 default: USER
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *       409:
 *         description: User already exists
 */
router.post("/sign-up", validate(signUpSchema), signUp);

/**
 * @swagger
 * /auth/sign-in:
 *   post:
 *     summary: Authenticate an existing user
 *     description: Rate-limited to 5 requests per 15 minutes.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Signed in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many requests
 */
router.post("/sign-in", authLimiter, validate(signInSchema), signIn);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Send a password-reset code to the user's email
 *     description: Rate-limited to 3 requests per hour.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent successfully
 *       404:
 *         description: No user found with this email
 *       429:
 *         description: Too many requests
 */
router.post(
  "/forgot-password",
  passwordResetLimiter,
  validate(forgotPasswordSchema),
  forgotPassword,
);

/**
 * @swagger
 * /auth/verify-reset-code:
 *   post:
 *     summary: Verify the 6-digit reset code sent by email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, resetCode]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               resetCode:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Reset code verified successfully
 *       400:
 *         description: Invalid or expired reset code
 */
router.post(
  "/verify-reset-code",
  validate(verifyResetCodeSchema),
  verifyResetCode,
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Set a new password after the reset code has been verified
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, newPassword]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               newPassword:
 *                 type: string
 *                 example: NewPassword1!
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Reset code not verified
 */
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

/**
 * @swagger
 * /auth/google-login:
 *   post:
 *     summary: Authenticate or register a user via Google OAuth token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *                 description: Google OAuth token
 *     responses:
 *       200:
 *         description: Google login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *       400:
 *         description: Google token is required
 */
router.post("/google-login", validate(googleLoginSchema), googleLogin);

export default router;
