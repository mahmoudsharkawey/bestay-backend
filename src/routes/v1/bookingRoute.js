import { Router } from "express";
import { Authenticate } from "../../middlewares/authMiddleware.js";
import { getAllBookings } from "../../controllers/bookingController.js";

const router = Router();

// GET /bookings/my — all bookings for the authenticated user or landlord
router.get("/my", Authenticate, getAllBookings);

export default router;
