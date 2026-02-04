import { Router } from "express";
import {
  signUp,
  signIn,
  signOut,
  forgotPassword,
  verifyResetCode,
  resetPassword,
} from "../../controllers/authController.js";

const router = Router();

router.post("/signup", signUp);
router.post("/signin", signIn);
router.post("/signout", signOut);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);

export default router;
