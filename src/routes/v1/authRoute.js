import { Router } from "express";
import { signUp, signIn, signOut } from "../../controllers/authController.js";

const router = Router();

router.post("/signup", signUp);
router.post("/signin", signIn);
router.post("/signout", signOut);

export default router;
