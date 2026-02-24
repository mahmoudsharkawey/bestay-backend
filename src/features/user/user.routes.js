import { Router } from "express";
import {
  getMyProfile,
  updateMyProfile,
  deleteMyAccount,
  changeMyPassword,
  getMyPreferences,
  saveMyPreferences,
} from "./user.controller.js";
import { Authenticate } from "../../middlewares/authMiddleware.js";

const router = Router();

// GET  /api/v1/user/me — Get authenticated user's profile
router.get("/me", Authenticate, getMyProfile);

// PUT  /api/v1/user/me — Update authenticated user's profile (name, phone, picture)
router.put("/me", Authenticate, updateMyProfile);

// DELETE /api/v1/user/delete-profile — Soft-delete the authenticated user's account
router.delete("/delete-profile", Authenticate, deleteMyAccount);

// PATCH /api/v1/user/change-password — Change the authenticated user's password
router.patch("/change-password", Authenticate, changeMyPassword);

// GET  /api/v1/user/preferences — Get the authenticated user's preferences
router.get("/preferences", Authenticate, getMyPreferences);

// POST /api/v1/user/preferences — Create or update the authenticated user's preferences
router.post("/preferences", Authenticate, saveMyPreferences);

export default router;
