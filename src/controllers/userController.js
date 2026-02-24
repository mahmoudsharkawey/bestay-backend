import httpResponse from "../utils/httpResponse.js";
import httpError from "../utils/httpError.js";
import * as UserService from "../services/userService.js";

// GET /user/me — Get the authenticated user's profile
export const getMyProfile = async (req, res, next) => {
  try {
    const data = await UserService.getProfile(req.user.id);
    httpResponse(req, res, 200, "User profile retrieved successfully", data);
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

// PUT /user/me — Update the authenticated user's profile
export const updateMyProfile = async (req, res, next) => {
  try {
    const data = await UserService.updateProfile(req.user.id, req.body);
    httpResponse(req, res, 200, "User profile updated successfully", data);
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

// DELETE /user/delete-profile — Soft-delete the authenticated user's account
export const deleteMyAccount = async (req, res, next) => {
  try {
    const data = await UserService.deleteAccount(req.user.id, req.user.id);
    httpResponse(req, res, 200, "User profile deleted successfully", data);
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

// PATCH /user/change-password — Change the authenticated user's password
export const changeMyPassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return httpError(
        next,
        new Error("Old password and new password are required"),
        req,
        400,
      );
    }
    await UserService.changePassword(req.user.id, oldPassword, newPassword);
    httpResponse(req, res, 200, "Password changed successfully");
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

// GET /user/preferences — Get the authenticated user's preferences
export const getMyPreferences = async (req, res, next) => {
  try {
    const data = await UserService.getPreferences(req.user.id);
    httpResponse(
      req,
      res,
      200,
      "User preferences retrieved successfully",
      data,
    );
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

// POST /user/preferences — Create or update the authenticated user's preferences
export const saveMyPreferences = async (req, res, next) => {
  try {
    const data = await UserService.savePreferences(req.user.id, req.body);
    httpResponse(req, res, 200, "User preferences saved successfully", data);
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};
