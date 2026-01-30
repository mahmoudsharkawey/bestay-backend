import { Router } from "express";
import { WelcomController } from "../../controllers/welcomController.js";
import { HealthController } from "../../controllers/healthController.js";
const router = Router();

// Example route
router.get("/", WelcomController);
router.get("/health", HealthController);

export default router;
