import { Router } from "express";
import { Authenticate } from "../../middlewares/authMiddleware.js";
import { authorizeRoles } from "../../middlewares/roleMiddleware.js";
import {
  createPaymentIntent,
  refundPayment,
} from "../../controllers/paymentController.js";

const router = Router();

////////////////////
// User routes
////////////////////

// User creates a payment intent for an approved visit
router.post("/intent", Authenticate, createPaymentIntent);

////////////////////
// Admin routes
////////////////////

// Admin refunds a payment — not exposed to regular users
router.post(
  "/:id/refund",
  Authenticate,
  authorizeRoles("ADMIN"),
  refundPayment,
);

export default router;
