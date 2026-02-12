import { Router } from "express";
import { Authenticate } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validateMiddleware.js";
import {
  createBookingSchema,
  createPaymentIntentSchema,
  confirmPaymentSchema,
  cancelBookingSchema,
} from "../../validations/bookingValidation.js";
import {
  cancelBooking,
  confirmPayment,
  createBooking,
  createPaymentIntent,
  getAllBookings,
} from "../../controllers/bookingController.js";

const router = Router();

router.post("/", Authenticate, validate(createBookingSchema), createBooking);
router.get("/all", Authenticate, getAllBookings);
router.post(
  "/create-payment-intent",
  Authenticate,
  validate(createPaymentIntentSchema),
  createPaymentIntent,
);
router.post(
  "/confirm-payment",
  Authenticate,
  validate(confirmPaymentSchema),
  confirmPayment,
);
router.post(
  "/cancel-booking",
  Authenticate,
  validate(cancelBookingSchema),
  cancelBooking,
);

export default router;
