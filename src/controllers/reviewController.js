import httpError from "../utils/httpError.js";
import httpResponse from "../utils/httpResponse.js";
import * as reviewService from "../services/reviewService.js";

/**
 * Create a new review
 */
export const createReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const unitId = req.params.unitId;

    // Validate required fields
    if (!unitId || !rating) {
      throw new Error("unitId, and rating are required");
    }

    const reviewData = {
      userId: req.user.id,
      unitId,
      rating: Number(rating),
      comment,
    };

    const review = await reviewService.createReview(reviewData);

    httpResponse(req, res, 201, "Review created successfully", review);
  } catch (error) {
    httpError(next, error, req, 500);
  }
};

/**
 * Get all reviews for a specific unit
 */
export const getReviewsByUnitId = async (req, res, next) => {
  try {
    const { unitId } = req.params;

    if (!unitId) {
      throw new Error("Unit ID is required");
    }

    const reviews = await reviewService.getReviewsByUnitId(unitId);

    httpResponse(req, res, 200, "Reviews retrieved successfully", reviews);
  } catch (error) {
    httpError(next, error, req, 500);
  }
};

/**
 * Get a single review by ID
 */
export const getReviewById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new Error("Review ID is required");
    }

    const review = await reviewService.getReviewById(id);

    httpResponse(req, res, 200, "Review retrieved successfully", review);
  } catch (error) {
    httpError(next, error, req, 500);
  }
};

/**
 * Update a review by ID
 */
export const updateReviewById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, rating, comment } = req.body;

    if (!id) {
      throw new Error("Review ID is required");
    }

    if (!userId) {
      throw new Error("User ID is required for authorization");
    }

    const updateData = {};
    if (rating !== undefined) updateData.rating = Number(rating);
    if (comment !== undefined) updateData.comment = comment;

    const review = await reviewService.updateReviewById(id, userId, updateData);

    httpResponse(req, res, 200, "Review updated successfully", review);
  } catch (error) {
    httpError(next, error, req, 500);
  }
};

/**
 * Delete a review by ID
 */
export const deleteReviewById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!id) {
      throw new Error("Review ID is required");
    }

    if (!userId) {
      throw new Error("User ID is required for authorization");
    }

    const deletedReview = await reviewService.deleteReviewById(id, userId);

    httpResponse(req, res, 200, "Review deleted successfully", deletedReview);
  } catch (error) {
    httpError(next, error, req, 500);
  }
};
