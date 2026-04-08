import { Router } from "express";
import { Authenticate } from "../../middlewares/authMiddleware.js";
import { authorizeRoles } from "../../middlewares/roleMiddleware.js";
import * as recommendationController from "./recommendation.controller.js";

const router = Router();

// GET /api/v1/recommendations — AI-scored unit recommendations for the logged-in user
router.get(
  "/",
  Authenticate,
  authorizeRoles("USER"),
  recommendationController.getRecommendations,
);

export default router;
