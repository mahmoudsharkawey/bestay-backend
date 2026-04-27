import express from "express";
import * as favoriteController from "./favorite.controller.js";
import { Authenticate } from "../../middlewares/authMiddleware.js";
import { authorizeRoles } from "../../middlewares/roleMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /favorites:
 *   post:
 *     summary: Add a unit to a user's favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, unitId]
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               unitId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Favorite added successfully
 *       409:
 *         description: Already favorited
 */
router.post(
  "/",
  Authenticate,
  authorizeRoles("USER", "LANDLORD"),
  favoriteController.addFavorite,
);

/**
 * @swagger
 * /favorites/{unitId}:
 *   delete:
 *     summary: Remove a unit from a user's favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: unitId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Favorite removed successfully
 *       404:
 *         description: Favorite not found
 */
router.delete(
  "/:unitId",
  Authenticate,
  authorizeRoles("USER", "LANDLORD"),
  favoriteController.removeFavorite,
);

/**
 * @swagger
 * /favorites/user/{userId}:
 *   get:
 *     summary: Get all favorited units for a specific user
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Favorites retrieved successfully
 */
router.get("/user/:userId", Authenticate, favoriteController.getUserFavorites);

/**
 * @swagger
 * /favorites/check/{unitId}/{userId}:
 *   get:
 *     summary: Check if a unit is already favorited by a user
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: unitId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Favorite check result
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
 *                     isFavorited:
 *                       type: boolean
 */
router.get(
  "/check/:unitId/:userId",
  Authenticate,
  favoriteController.checkIfFavorited,
);

export default router;
