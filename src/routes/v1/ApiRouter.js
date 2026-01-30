import { Router } from "express";
import { WelcomController } from "../../controllers/welcomController.js";

const router = Router();

// Example route
router.get("/", WelcomController);

export default router;
