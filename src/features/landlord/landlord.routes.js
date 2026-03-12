import { Router } from "express";
import { Authenticate } from "../../middlewares/authMiddleware.js";
import { authorizeRoles } from "../../middlewares/roleMiddleware.js";
import { getDashboardStats } from "./landlord.controller.js";

const router = Router();

// GET /api/v1/landlord/dashboard - Get landlord dashboard statistics
router.get(
  "/dashboard",
  Authenticate,
  authorizeRoles("LANDLORD", "ADMIN"),
  getDashboardStats,
);

export default router;
