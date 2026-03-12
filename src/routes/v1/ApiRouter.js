import { Router } from "express";
import { WelcomController } from "../../features/common/welcome.controller.js";
import { HealthController } from "../../features/common/health.controller.js";
import authRoute from "../../features/auth/auth.routes.js";
import userRoute from "../../features/user/user.routes.js";
import unitRoute from "../../features/unit/unit.routes.js";
import reviewRoute from "../../features/review/review.routes.js";
import favoriteRoute from "../../features/favorite/favorite.routes.js";
import bookingRoute from "../../features/booking/booking.routes.js";
import visitRoute from "../../features/visit/visit.routes.js";
import paymentRoute from "../../features/payment/payment.routes.js";
import notificationRoute from "../../features/notification/notification.routes.js";
import uploadRoute from "../../features/upload/upload.routes.js";
import adminRoute from "../../features/admin/admin.routes.js";
import landlordRoute from "../../features/landlord/landlord.routes.js";

const router = Router();

// Auth Routes
router.use("/auth", authRoute);
// User Routes
router.use("/users", userRoute);
// Unit Routes
router.use("/units", unitRoute);
// Review Routes
router.use("/reviews", reviewRoute);
// Favorite Routes
router.use("/favorites", favoriteRoute);
// Booking Routes
router.use("/bookings", bookingRoute);
// Visit Routes
router.use("/visits", visitRoute);
// Payment Routes
router.use("/payments", paymentRoute);
// Notification Routes
router.use("/notifications", notificationRoute);
// Upload Routes
router.use("/uploads", uploadRoute);
// Admin Routes
router.use("/admin", adminRoute);
// Landlord Routes
router.use("/landlord", landlordRoute);

// Example Routes
router.get("/", WelcomController);
router.get("/health", HealthController);

export default router;
