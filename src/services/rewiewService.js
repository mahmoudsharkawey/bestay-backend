import prisma from "../prisma/client.js";

/**
 * Create a new review for a unit
 * @param {Object} data - Review data including userId, unitId, rating, and optional comment
 * @returns {Promise<Object>} Created review
 */
export const createReview = async (data) => {
  const { userId, unitId, rating, comment } = data;

  // Validate that the unit exists
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
  });

  if (!unit) {
    throw new Error("Unit not found");
  }

  // Validate that the user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Validate rating is between 1-5
  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  // Create the review
  const review = await prisma.review.create({
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

  if (!review) {
    throw new Error("Failed to create review");
  }

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
    throw new Error("Unit not found");
  }

  const reviews = await prisma.review.findMany({
    where: { unitId },
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

  if (!review) {
    throw new Error("Review not found");
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

  if (!review) {
    throw new Error("Review not found");
  }

  // Only allow the review author to update
  if (review.userId !== userId) {
    throw new Error("You are not authorized to update this review");
  }

  // Validate rating if provided
  if (data.rating && (data.rating < 1 || data.rating > 5)) {
    throw new Error("Rating must be between 1 and 5");
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
    throw new Error("Failed to update review");
  }

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

  if (!review) {
    throw new Error("Review not found");
  }

  // Only allow the review author to delete
  if (review.userId !== userId) {
    throw new Error("You are not authorized to delete this review");
  }

  const deletedReview = await prisma.review.delete({
    where: { id },
  });

  if (!deletedReview) {
    throw new Error("Failed to delete review");
  }

  return deletedReview;
};
