import httpResponse from "../utils/httpResponse.js";
import httpError from "../utils/httpError.js";
import * as UserService from "../services/userService.js";

// Get user profile
export const getUserProfile = async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) {
      return httpError(next, new Error("ID   is required"), req, 400);
    }

    const data = await UserService.getUserDetails(id);
    httpResponse(req, res, 200, "User profile retrieved successfully", data);
  } catch (error) {
    httpError(next, error, req, 500);
  }
};

// Update user profile
export const updateUserProfile = async (req, res, next) => {
  try {
    const { id, userDetails } = req.body;
    if (!id || !userDetails)
      httpError(next, new Error("ID and user details are required"), req, 400);

    const data = await UserService.updateUserDetails(id, userDetails);
    httpResponse(req, res, 200, "User profile updated successfully", data);
  } catch (error) {
    httpError(next, error, req, 500);
  }
};

// Delete user profile
export const deleteUserProfile = async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) {
      return httpError(next, new Error("ID is required"), req, 400);
    }

    const data = await UserService.deleteUser(id);
    httpResponse(req, res, 200, "User profile deleted successfully", data);
  } catch (error) {
    httpError(next, error, req, 500);
  }
};

// Change password
export const changeUserPassword = async (req, res, next) => {
  try {
    const { id, oldPassword, newPassword } = req.body;
    if (!id || !oldPassword || !newPassword) {
      return httpError(
        next,
        new Error("ID, old password and new password are required"),
        req,
        400,
      );
    }
    const data = await UserService.changePassword(id, oldPassword, newPassword);
    httpResponse(req, res, 200, "Password changed successfully", data);
  } catch (error) {
    httpError(next, error, req, 500);
  }
};

// Get user preferences
export const getUserPreferences = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return httpError(next, new Error("User ID is required"), req, 400);
    }
    const data = await UserService.getUserPreference(userId);
    httpResponse(
      req,
      res,
      200,
      "User preferences retrieved successfully",
      data,
    );
  } catch (error) {
    httpError(next, error, req, 500);
  }
};

// Create or update user preferences
export const upsertUserPreferences = async (req, res, next) => {
  try {
    const { userId, prefs } = req.body;
    if (!userId || !prefs) {
      return httpError(
        next,
        new Error("User ID and preferences are required"),
        req,
        400,
      );
    }
    const data = await UserService.upsertUserPreference(userId, prefs);
    httpResponse(
      req,
      res,
      200,
      "User preferences created or updated successfully",
      data,
    );
  } catch (error) {
    httpError(next, error, req, 500);
  }
};
