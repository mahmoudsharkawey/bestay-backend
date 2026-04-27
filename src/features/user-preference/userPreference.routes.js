import { Router } from "express";
import { Authenticate } from "../../middlewares/authMiddleware.js";
import { authorizeRoles } from "../../middlewares/roleMiddleware.js";
import { validate } from "../../middlewares/validateMiddleware.js";
import {
  createPreferenceSchema,
  updatePreferenceSchema,
} from "./userPreference.validation.js";
import * as userPreferenceController from "./userPreference.controller.js";

const router = Router();

/**
 * @swagger
 * /user-preferences:
 *   post:
 *     summary: Create or update preference (upsert)
 *     tags: [User Preferences]
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
 *         description: Preference saved successfully
 *       403:
 *         description: USER role required
 */
router.post(
  "/",
  Authenticate,
  authorizeRoles("USER"),
  validate(createPreferenceSchema),
  userPreferenceController.upsertPreference,
);

/**
 * @swagger
 * /user-preferences/me:
 *   get:
 *     summary: Get current user's preference
 *     tags: [User Preferences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Preference retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserPreference'
 *       404:
 *         description: No preferences found
 */
router.get(
  "/me",
  Authenticate,
  authorizeRoles("USER"),
  userPreferenceController.getMyPreference,
);

/**
 * @swagger
 * /user-preferences/matching-units:
 *   get:
 *     summary: Get units matching user's preference
 *     tags: [User Preferences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Matching units retrieved
 *       404:
 *         description: No preferences set
 */
router.get(
  "/matching-units",
  Authenticate,
  authorizeRoles("USER"),
  userPreferenceController.getMatchingUnits,
);

/**
 * @swagger
 * /user-preferences:
 *   patch:
 *     summary: Partially update preference
 *     tags: [User Preferences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserPreference'
 *     responses:
 *       200:
 *         description: Preference updated
 *       403:
 *         description: USER role required
 */
router.patch(
  "/",
  Authenticate,
  authorizeRoles("USER"),
  validate(updatePreferenceSchema),
  userPreferenceController.updatePreference,
);

/**
 * @swagger
 * /user-preferences:
 *   delete:
 *     summary: Delete preference
 *     tags: [User Preferences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Preference deleted
 *       403:
 *         description: USER role required
 */
router.delete(
  "/",
  Authenticate,
  authorizeRoles("USER"),
  userPreferenceController.deletePreference,
);

export default router;
