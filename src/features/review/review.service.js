import prisma from "../../prisma/client.js";
import { softDelete } from "../../utils/softDelete.js";
import AppError from "../../utils/AppError.js";

/**
 * Helper to recalculate and update a unit's average rating
 */
const updateUnitAverageRating = async (unitId) => {
  const aggregate = await prisma.review.aggregate({
    where: { unitId, deletedAt: null },
    _avg: { rating: true },
  });

  const newAvg = aggregate._avg.rating || 0;

  await prisma.unit.update({
    where: { id: unitId },
    data: { averageRating: parseFloat(newAvg.toFixed(1)) },
  });
};

/**
 * Create a new review for a unit
 * @param {Object} data - Review data including userId, unitId, rating, and optional comment
 * @returns {Promise<Object>} Created review
 */
export const createReview = async (data) => {
  const { userId, unitId, rating, comment } = data;

  // Check if user already has a review for this unit
  const existingReview = await prisma.review.findFirst({
    where: { userId, unitId },
  });

  if (existingReview && !existingReview.deletedAt) {
    throw new AppError("You have already reviewed this unit", 409);
  }

  // Validate that the unit exists
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
  });

  if (!unit || unit.deletedAt) {
    throw new AppError("Unit not found", 404);
  }

  // Validate that the user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.deletedAt) {
    throw new AppError("User not found", 404);
  }

  if (rating < 1 || rating > 5) {
    throw new AppError("Rating must be between 1 and 5", 400);
  }

  // Create or restore the review
  let review;
  if (existingReview && existingReview.deletedAt) {
    review = await prisma.review.update({
      where: { id: existingReview.id },
      data: {
        rating,
        comment: comment || null,
        deletedAt: null,
        deletedById: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            picture: true,
          },
        },
      },
    });
  } else {
    review = await prisma.review.create({
      data: {
        userId,
        unitId,
        rating,
        comment: comment || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            picture: true,
          },
        },
      },
    });
  }

  if (!review) {
    throw new AppError("Failed to create review", 500);
  }

  await updateUnitAverageRating(unitId);

  return review;
};

/**
 * Get all reviews for a specific unit
 * @param {string} unitId - Unit ID
 * @returns {Promise<Array>} Array of reviews with user information
 */
export const getReviewsByUnitId = async (unitId) => {
  // Validate that the unit exists
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
  });

  if (!unit) {
    throw new AppError("Unit not found", 404);
  }

  const reviews = await prisma.review.findMany({
    where: { unitId, deletedAt: null },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          picture: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return reviews;
};

/**
 * Get a single review by ID
 * @param {string} id - Review ID
 * @returns {Promise<Object>} Review with user information
 */
export const getReviewById = async (id) => {
  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          picture: true,
        },
      },
      unit: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (!review || review.deletedAt) {
    throw new AppError("Review not found", 404);
  }

  return review;
};

/**
 * Update a review by ID
 * @param {string} id - Review ID
 * @param {string} userId - User ID (for authorization)
 * @param {Object} data - Updated review data (rating and/or comment)
 * @returns {Promise<Object>} Updated review
 */
export const updateReviewById = async (id, userId, data) => {
  const review = await prisma.review.findUnique({
    where: { id },
  });

  if (!review || review.deletedAt) {
    throw new AppError("Review not found", 404);
  }

  if (review.userId !== userId) {
    throw new AppError("You are not authorized to update this review", 403);
  }

  if (data.rating && (data.rating < 1 || data.rating > 5)) {
    throw new AppError("Rating must be between 1 and 5", 400);
  }

  const updatedReview = await prisma.review.update({
    where: { id },
    data: {
      rating: data.rating !== undefined ? data.rating : review.rating,
      comment: data.comment !== undefined ? data.comment : review.comment,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          picture: true,
        },
      },
    },
  });

  if (!updatedReview) {
    throw new AppError("Failed to update review", 500);
  }

  await updateUnitAverageRating(review.unitId);

  return updatedReview;
};

/**
 * Delete a review by ID
 * @param {string} id - Review ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Object>} Deleted review
 */
export const deleteReviewById = async (id, userId) => {
  const review = await prisma.review.findUnique({
    where: { id },
  });

  if (!review || review.deletedAt) {
    throw new AppError("Review not found", 404);
  }

  if (review.userId !== userId) {
    throw new AppError("You are not authorized to delete this review", 403);
  }

  const deletedReview = await softDelete(prisma.review, id, userId);

  if (!deletedReview) {
    throw new AppError("Failed to delete review", 500);
  }

  await updateUnitAverageRating(review.unitId);

  return deletedReview;
};
