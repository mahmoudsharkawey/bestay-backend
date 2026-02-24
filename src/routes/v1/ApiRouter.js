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

const router = Router();

// Example route
router.get("/", WelcomController);
router.get("/health", HealthController);

// Auth routes
router.use("/auth", authRoute);
router.use("/users", userRoute);
router.use("/units", unitRoute);
router.use("/reviews", reviewRoute);
router.use("/favorites", favoriteRoute);
router.use("/bookings", bookingRoute);
router.use("/visits", visitRoute);
router.use("/payments", paymentRoute);
router.use("/notifications", notificationRoute);

export default router;
