import { Router } from "express";
import { Authenticate } from "../../middlewares/authMiddleware.js";
import { authorizeRoles } from "../../middlewares/roleMiddleware.js";
import {
  createPaymentIntent,
  refundPayment,
  getMyPayments,
} from "./payment.controller.js";

const router = Router();

////////////////////
// User routes
////////////////////

// User creates a payment intent for an approved visit
router.post("/intent", Authenticate, createPaymentIntent);

// GET: all payments for the caller (USER sees own, LANDLORD sees payments on their units)
router.get("/my", Authenticate, getMyPayments);

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
