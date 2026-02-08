import express from "express";
import * as reviewController from "../../controllers/reviewController.js";
import { Authenticate } from "../../middlewares/authMiddleware.js";
import { authorizeRoles } from "../../middlewares/roleMiddleware.js";

const router = express.Router();

// Create a new review
router.post(
  "/",
  Authenticate,
  authorizeRoles("USER", "LANDLORD"),
  reviewController.createReview,
);

// Get all reviews for a specific unit
router.get("/unit/:unitId", Authenticate, reviewController.getReviewsByUnitId);

// Get a single review by ID
router.get("/:id", Authenticate, reviewController.getReviewById);

// Update a review by ID
router.put(
  "/:id",
  Authenticate,
  authorizeRoles("USER", "LANDLORD"),
  reviewController.updateReviewById,
);

// Delete a review by ID
router.delete(
  "/:id",
  Authenticate,
  authorizeRoles("USER", "LANDLORD"),
  reviewController.deleteReviewById,
);

export default router;
