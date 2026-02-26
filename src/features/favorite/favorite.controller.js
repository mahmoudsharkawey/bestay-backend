import httpError from "../../utils/httpError.js";
import httpResponse from "../../utils/httpResponse.js";
import AppError from "../../utils/AppError.js";
import * as favoriteService from "./favorite.service.js";

/**
 * Add a unit to user's favorites
 */
export const addFavorite = async (req, res, next) => {
  try {
    const { userId, unitId } = req.body;

    // Validate required fields
    if (!userId || !unitId) {
      throw new AppError("userId and unitId are required", 400);
    }

    const favorite = await favoriteService.addFavorite({ userId, unitId });

    httpResponse(
      req,
      res,
      201,
      "Unit added to favorites successfully",
      favorite,
    );
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

/**
 * Remove a unit from user's favorites
 */
export const removeFavorite = async (req, res, next) => {
  try {
    const { unitId } = req.params;
    const { userId } = req.body;

    if (!userId || !unitId) {
      throw new AppError("userId and unitId are required", 400);
    }

    const deletedFavorite = await favoriteService.removeFavorite(
      userId,
      unitId,
    );

    httpResponse(
      req,
      res,
      200,
      "Unit removed from favorites successfully",
      deletedFavorite,
    );
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

/**
 * Get all favorite units for a user
 */
export const getUserFavorites = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const favorites = await favoriteService.getUserFavorites(userId);

    httpResponse(req, res, 200, "Favorites retrieved successfully", favorites);
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

/**
 * Check if a specific unit is favorited by a user
 */
export const checkIfFavorited = async (req, res, next) => {
  try {
    const { unitId, userId } = req.params;

    if (!userId || !unitId) {
      throw new AppError("userId and unitId are required", 400);
    }

    const result = await favoriteService.checkIfFavorited(userId, unitId);

    httpResponse(req, res, 200, "Favorite status checked successfully", result);
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};
