import { Router } from "express";
import { WelcomController } from "../../controllers/welcomController.js";
import { HealthController } from "../../controllers/healthController.js";
import authRoute from "./authRoute.js";
import userRoute from "./userRoute.js";
import unitRoute from "./unitRoute.js";
import reviewRoute from "./reviewRoute.js";
import favoriteRoute from "./favoriteRoute.js";
const router = Router();

// Example route
router.get("/", WelcomController);
router.get("/health", HealthController);

// Auth routes
router.use("/auth", authRoute);
router.use("/user", userRoute);
router.use("/units", unitRoute);
router.use("/reviews", reviewRoute);
router.use("/favorites", favoriteRoute);

export default router;
