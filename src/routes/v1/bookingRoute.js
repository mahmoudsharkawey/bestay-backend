import { Router } from "express";
import { Authenticate } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validateMiddleware.js";
import { createBookingSchema } from "../../validations/bookingValidation.js";
import {
  createBooking,
  getAllBookings,
} from "../../controllers/bookingController.js";

const router = Router();

// Create a booking from a confirmed visit
router.post("/", Authenticate, validate(createBookingSchema), createBooking);

// Get all bookings for the authenticated user
router.get("/all", Authenticate, getAllBookings);

export default router;
