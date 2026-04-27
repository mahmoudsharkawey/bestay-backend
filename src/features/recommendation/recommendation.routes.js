import { Router } from "express";
import { Authenticate } from "../../middlewares/authMiddleware.js";
import { authorizeRoles } from "../../middlewares/roleMiddleware.js";
import * as recommendationController from "./recommendation.controller.js";

const router = Router();

/**
 * @swagger
 * /recommendations:
 *   get:
 *     summary: Get AI-scored unit recommendations
 *     description: Uses user preferences and Gemini AI to score and rank units.
 *     tags: [AI Recommendations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recommendations generated
 *       404:
 *         description: No user preferences found
 */
router.get(
  "/",
  Authenticate,
  authorizeRoles("USER"),
  recommendationController.getRecommendations,
);

export default router;
