import { Router } from "express";
import { Authenticate } from "../../middlewares/authMiddleware.js";
import { authorizeRoles } from "../../middlewares/roleMiddleware.js";
import {
  createPaymentIntent,
  refundPayment,
  getMyPayments,
  getAllPayments,
} from "./payment.controller.js";

const router = Router();

////////////////////
// User routes
////////////////////

// User creates a payment intent for an approved visit
router.post(
  "/intent",
  Authenticate,
  authorizeRoles("USER"),
  createPaymentIntent,
);

// GET: all payments for the caller (USER sees own, LANDLORD sees payments on their units)
router.get("/my", Authenticate, authorizeRoles("USER"), getMyPayments);

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

// GET: all payments for the caller (ADMIN sees all payments)
router.get("/", Authenticate, authorizeRoles("ADMIN"), getAllPayments);

export default router;
