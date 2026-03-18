import httpError from "../../utils/httpError.js";
import httpResponse from "../../utils/httpResponse.js";
import * as userPreferenceService from "./userPreference.service.js";

/**
 * Create or update the logged-in user's preference (upsert)
 */
export const upsertPreference = async (req, res, next) => {
  try {
    const preference = await userPreferenceService.upsertPreference(
      req.user.id,
      req.body,
    );

    httpResponse(
      req,
      res,
      201,
      "Preference saved successfully",
      preference,
    );
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

/**
 * Get the logged-in user's preference
 */
export const getMyPreference = async (req, res, next) => {
  try {
    const preference = await userPreferenceService.getPreference(req.user.id);

    httpResponse(
      req,
      res,
      200,
      "Preference retrieved successfully",
      preference,
    );
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

/**
 * Partially update the logged-in user's preference
 */
export const updatePreference = async (req, res, next) => {
  try {
    const preference = await userPreferenceService.updatePreference(
      req.user.id,
      req.body,
    );

    httpResponse(
      req,
      res,
      200,
      "Preference updated successfully",
      preference,
    );
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

/**
 * Delete the logged-in user's preference
 */
export const deletePreference = async (req, res, next) => {
  try {
    const deletedPreference = await userPreferenceService.deletePreference(
      req.user.id,
    );

    httpResponse(
      req,
      res,
      200,
      "Preference deleted successfully",
      deletedPreference,
    );
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

/**
 * Get units matching the logged-in user's preference
 */
export const getMatchingUnits = async (req, res, next) => {
  try {
    // First, fetch the user's preference
    const preference = await userPreferenceService.getPreference(req.user.id);

    // Then, find matching units
    const units = await userPreferenceService.getMatchingUnits(preference);

    httpResponse(
      req,
      res,
      200,
      "Matching units retrieved successfully",
      units,
    );
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};
