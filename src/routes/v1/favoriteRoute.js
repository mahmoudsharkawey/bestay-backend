import express from "express";
import * as favoriteController from "../../controllers/favoriteController.js";
import { Authenticate } from "../../middlewares/authMiddleware.js";
import { authorizeRoles } from "../../middlewares/roleMiddleware.js";

const router = express.Router();

// Add a unit to favorites
router.post(
  "/",
  Authenticate,
  authorizeRoles("USER", "LANDLORD"),
  favoriteController.addFavorite,
);

// Remove a unit from favorites
router.delete(
  "/:unitId",
  Authenticate,
  authorizeRoles("USER", "LANDLORD"),
  favoriteController.removeFavorite,
);

// Get all favorites for a user
router.get("/user/:userId", Authenticate, favoriteController.getUserFavorites);

// Check if a unit is favorited by a user
router.get(
  "/check/:unitId/:userId",
  Authenticate,
  favoriteController.checkIfFavorited,
);

export default router;
