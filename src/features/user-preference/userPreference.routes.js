import { Router } from "express";
import { Authenticate } from "../../middlewares/authMiddleware.js";
import { authorizeRoles } from "../../middlewares/roleMiddleware.js";
import { validate } from "../../middlewares/validateMiddleware.js";
import {
  createPreferenceSchema,
  updatePreferenceSchema,
} from "./userPreference.validation.js";
import * as userPreferenceController from "./userPreference.controller.js";

const router = Router();

// POST /api/v1/user-preferences — Create or update preference (upsert)
router.post(
  "/",
  Authenticate,
  authorizeRoles("USER"),
  validate(createPreferenceSchema),
  userPreferenceController.upsertPreference,
);

// GET /api/v1/user-preferences/me — Get current user's preference
router.get(
  "/me",
  Authenticate,
  authorizeRoles("USER"),
  userPreferenceController.getMyPreference,
);

// GET /api/v1/user-preferences/matching-units — Get units matching user's preference
router.get(
  "/matching-units",
  Authenticate,
  authorizeRoles("USER"),
  userPreferenceController.getMatchingUnits,
);

// PATCH /api/v1/user-preferences — Partially update preference
router.patch(
  "/",
  Authenticate,
  authorizeRoles("USER"),
  validate(updatePreferenceSchema),
  userPreferenceController.updatePreference,
);

// DELETE /api/v1/user-preferences — Delete preference
router.delete(
  "/",
  Authenticate,
  authorizeRoles("USER"),
  userPreferenceController.deletePreference,
);

export default router;
