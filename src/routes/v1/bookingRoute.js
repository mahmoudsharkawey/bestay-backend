import { Router } from "express";
import { Authenticate } from "../../middlewares/authMiddleware.js";
import {
  confirmPayment,
  createBooking,
  createPaymentIntent,
  getAllBookings,
} from "../../controllers/bookingController.js";

const router = Router();

router.post("/", Authenticate, createBooking);
router.get("/all", Authenticate, getAllBookings);
router.post("/create-payment-intent", Authenticate, createPaymentIntent);
router.post("/confirm-payment", Authenticate, confirmPayment);


export default router;
