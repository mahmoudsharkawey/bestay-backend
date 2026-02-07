import { Router } from "express";
import { WelcomController } from "../../controllers/welcomController.js";
import { HealthController } from "../../controllers/healthController.js";
import authRoute from "./authRoute.js";
import userRoute from "./userRoute.js";
import unitRoute from "./unitRoute.js";
const router = Router();

// Example route
router.get("/", WelcomController);
router.get("/health", HealthController);

// Auth routes
router.use("/auth", authRoute);
router.use("/user", userRoute);
router.use("/units", unitRoute);

export default router;
