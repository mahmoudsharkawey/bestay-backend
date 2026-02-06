import { Router } from "express";
import {
    changeUserPassword,
  deleteUserProfile,
  getUserPreferences,
  getUserProfile,
  updateUserProfile,
  upsertUserPreferences,
} from "../../controllers/userController.js";
import { Authenticate } from "../../middlewares/authMiddleware.js";

const router = Router();

router.get("/me", Authenticate, getUserProfile);
router.put("/me", Authenticate, updateUserProfile);
router.delete("/me", Authenticate, deleteUserProfile);
router.put("/change-password", Authenticate, changeUserPassword);
router.get("/preferences", Authenticate, getUserPreferences);
router.post("/preferences", Authenticate, upsertUserPreferences);

export default router;
