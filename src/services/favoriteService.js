import prisma from "../prisma/client.js";

/**
 * Add a unit to user's favorites
 * @param {Object} data - Favorite data including userId and unitId
 * @returns {Promise<Object>} Created favorite
 */
export const addFavorite = async (data) => {
  const { userId, unitId } = data;

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

  // Check if already favorited
  const existingFavorite = await prisma.favorite.findUnique({
    where: {
      userId_unitId: {
        userId,
        unitId,
      },
    },
  });

  if (existingFavorite) {
    throw new Error("Unit is already in favorites");
  }

  // Create the favorite
  const favorite = await prisma.favorite.create({
    data: {
      userId,
      unitId,
    },
    include: {
      unit: {
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              picture: true,
            },
          },
        },
      },
    },
  });

  if (!favorite) {
    throw new Error("Failed to add favorite");
  }

  return favorite;
};

/**
 * Remove a unit from user's favorites
 * @param {string} userId - User ID
 * @param {string} unitId - Unit ID
 * @returns {Promise<Object>} Deleted favorite
 */
export const removeFavorite = async (userId, unitId) => {
  // Check if the favorite exists
  const favorite = await prisma.favorite.findUnique({
    where: {
      userId_unitId: {
        userId,
        unitId,
      },
    },
  });

  if (!favorite) {
    throw new Error("Favorite not found");
  }

  // Delete the favorite
  const deletedFavorite = await prisma.favorite.delete({
    where: {
      userId_unitId: {
        userId,
        unitId,
      },
    },
  });

  if (!deletedFavorite) {
    throw new Error("Failed to remove favorite");
  }

  return deletedFavorite;
};

/**
 * Get all favorite units for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of favorite units with details
 */
export const getUserFavorites = async (userId) => {
  // Validate that the user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId },
    include: {
      unit: {
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              picture: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculate average rating and review count for each unit
  const favoritesWithStats = favorites.map((favorite) => {
    const reviewCount = favorite.unit.reviews.length;
    const averageRating =
      reviewCount > 0
        ? favorite.unit.reviews.reduce(
            (sum, review) => sum + review.rating,
            0,
          ) / reviewCount
        : 0;

    return {
      id: favorite.id,
      userId: favorite.userId,
      unitId: favorite.unitId,
      createdAt: favorite.createdAt,
      unit: {
        ...favorite.unit,
        reviewCount,
        averageRating: parseFloat(averageRating.toFixed(1)),
        reviews: undefined, // Remove reviews array from response
      },
    };
  });

  return favoritesWithStats;
};

/**
 * Check if a specific unit is favorited by a user
 * @param {string} userId - User ID
 * @param {string} unitId - Unit ID
 * @returns {Promise<Object>} Object with isFavorited boolean
 */
export const checkIfFavorited = async (userId, unitId) => {
  const favorite = await prisma.favorite.findUnique({
    where: {
      userId_unitId: {
        userId,
        unitId,
      },
    },
  });

  return {
    isFavorited: !!favorite,
    favoriteId: favorite?.id || null,
  };
};
