import prisma from "../../prisma/client.js";
import AppError from "../../utils/AppError.js";

/**
 * Create or update a user's preference (upsert)
 * @param {string} userId - User ID
 * @param {Object} data - Preference data
 * @returns {Promise<Object>} Created or updated preference
 */
export const upsertPreference = async (userId, data) => {
  // Validate that the user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const preference = await prisma.userPreference.upsert({
    where: { userId },
    update: { ...data },
    create: { userId, ...data },
  });

  if (!preference) {
    throw new AppError("Failed to save preference", 500);
  }

  return preference;
};

/**
 * Get the current user's preference
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User preference
 */
export const getPreference = async (userId) => {
  const preference = await prisma.userPreference.findUnique({
    where: { userId },
  });

  if (!preference) {
    throw new AppError("Preference not found", 404);
  }

  return preference;
};

/**
 * Partially update the current user's preference
 * @param {string} userId - User ID
 * @param {Object} data - Partial preference data
 * @returns {Promise<Object>} Updated preference
 */
export const updatePreference = async (userId, data) => {
  // Ensure the preference exists before updating
  const existing = await prisma.userPreference.findUnique({
    where: { userId },
  });

  if (!existing) {
    throw new AppError("Preference not found", 404);
  }

  // If only one budget bound is sent, validate against the existing value
  if (data.minBudget !== undefined && data.maxBudget === undefined) {
    if (data.minBudget > existing.maxBudget) {
      throw new AppError(
        "minBudget must be less than or equal to maxBudget",
        400,
      );
    }
  }
  if (data.maxBudget !== undefined && data.minBudget === undefined) {
    if (existing.minBudget > data.maxBudget) {
      throw new AppError(
        "minBudget must be less than or equal to maxBudget",
        400,
      );
    }
  }

  const updatedPreference = await prisma.userPreference.update({
    where: { userId },
    data,
  });

  if (!updatedPreference) {
    throw new AppError("Failed to update preference", 500);
  }

  return updatedPreference;
};

/**
 * Delete the current user's preference
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Deleted preference
 */
export const deletePreference = async (userId) => {
  const existing = await prisma.userPreference.findUnique({
    where: { userId },
  });

  if (!existing) {
    throw new AppError("Preference not found", 404);
  }

  const deletedPreference = await prisma.userPreference.delete({
    where: { userId },
  });

  if (!deletedPreference) {
    throw new AppError("Failed to delete preference", 500);
  }

  return deletedPreference;
};

/**
 * Get units matching a user's preference.
 * Reusable for future AI/recommendation systems.
 *
 * Filters on: budget range, city, rooms, furnished, facilities (partial match),
 * genderType, and optional distance from university.
 *
 * @param {Object} preference - UserPreference record
 * @returns {Promise<Array>} Array of matching units
 */
export const getMatchingUnits = async (preference) => {
  const where = {
    status: "ACTIVE",
    deletedAt: null,
    // Budget range
    price: {
      gte: preference.minBudget,
      lte: preference.maxBudget,
    },
    // City
    city: preference.city,
    // Rooms
    rooms: {
      gte: preference.rooms,
    },
    // Furnished
    furnished: preference.furnished,
    // Gender type
    genderType: preference.genderType,
  };

  // Facilities — partial match (unit has at least some of the requested facilities)
  if (preference.facilities && preference.facilities.length > 0) {
    where.facilities = {
      hasSome: preference.facilities,
    };
  }

  // Distance from university (only if user specified both university and maxDistance)
  if (preference.university) {
    where.university = preference.university;

    if (preference.maxDistance !== null && preference.maxDistance !== undefined) {
      where.distance = {
        lte: preference.maxDistance,
      };
    }
  }

  const units = await prisma.unit.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          picture: true,
        },
      },
    },
  });

  return units;
};
