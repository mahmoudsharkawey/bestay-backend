import express from "express";
import * as reviewController from "./review.controller.js";
import { Authenticate } from "../../middlewares/authMiddleware.js";
import { authorizeRoles } from "../../middlewares/roleMiddleware.js";
import { validate } from "../../middlewares/validateMiddleware.js";
import { createReviewSchema, updateReviewSchema } from "./review.validation.js";

const router = express.Router();

/**
 * @swagger
 * /reviews/unit/{unitId}:
 *   post:
 *     summary: Create a review for a unit
 *     tags: [Reviews]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating]
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created successfully
 *       403:
 *         description: USER role required
 */
router.post(
  "/unit/:unitId",
  Authenticate,
  authorizeRoles("USER"),
  validate(createReviewSchema),
  reviewController.createReview,
);

/**
 * @swagger
 * /reviews/unit/{unitId}:
 *   get:
 *     summary: Get all reviews for a specific unit
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: unitId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 */
router.get("/unit/:unitId", Authenticate, reviewController.getReviewsByUnitId);

/**
 * @swagger
 * /reviews/{id}:
 *   get:
 *     summary: Get a single review by ID
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Review retrieved successfully
 *       404:
 *         description: Review not found
 */
router.get("/:id", Authenticate, reviewController.getReviewById);

/**
 * @swagger
 * /reviews/{id}:
 *   put:
 *     summary: Update a review (own reviews only)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       403:
 *         description: USER role required
 */
router.put(
  "/:id",
  Authenticate,
  authorizeRoles("USER"),
  validate(updateReviewSchema),
  reviewController.updateReviewById,
);

/**
 * @swagger
 * /reviews/{id}:
 *   delete:
 *     summary: Delete a review (own reviews only)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       403:
 *         description: USER role required
 */
router.delete(
  "/:id",
  Authenticate,
  authorizeRoles("USER"),
  reviewController.deleteReviewById,
);

export default router;
