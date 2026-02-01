import { Router } from "express";
import { WelcomController } from "../../controllers/welcomController.js";
import { HealthController } from "../../controllers/healthController.js";
import authRoute from "./authRoute.js";
const router = Router();

// Example route
router.get("/", WelcomController);
router.get("/health", HealthController);

// Auth routes
router.use("/auth", authRoute);

export default router;
