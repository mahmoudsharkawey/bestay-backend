import { Router } from "express";
import {
  getMyProfile,
  updateMyProfile,
  deleteMyAccount,
  changeMyPassword,
  getMyPreferences,
  saveMyPreferences,
} from "./user.controller.js";
import { Authenticate } from "../../middlewares/authMiddleware.js";

const router = Router();

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get the authenticated user's full profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get("/me", Authenticate, getMyProfile);

/**
 * @swagger
 * /users/me:
 *   put:
 *     summary: Update the authenticated user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               picture:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put("/me", Authenticate, updateMyProfile);

/**
 * @swagger
 * /users/me:
 *   delete:
 *     summary: Soft-delete the authenticated user's account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile deleted successfully
 *       401:
 *         description: Unauthorized
 */
router.delete("/me", Authenticate, deleteMyAccount);

/**
 * @swagger
 * /users/change-password:
 *   patch:
 *     summary: Change the current user's password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid old password
 *       401:
 *         description: Unauthorized
 */
router.patch("/change-password", Authenticate, changeMyPassword);

/**
 * @swagger
 * /users/me/preferences:
 *   get:
 *     summary: Retrieve user preferences
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User preferences retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserPreference'
 *       401:
 *         description: Unauthorized
 */
router.get("/me/preferences", Authenticate, getMyPreferences);

/**
 * @swagger
 * /users/me/preferences:
 *   post:
 *     summary: Create or update user preferences (upsert)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserPreference'
 *     responses:
 *       200:
 *         description: Preferences saved successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/me/preferences", Authenticate, saveMyPreferences);

export default router;
