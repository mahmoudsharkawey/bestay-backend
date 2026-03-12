import { Router } from "express";
import { Authenticate } from "../../middlewares/authMiddleware.js";
import { authorizeRoles } from "../../middlewares/roleMiddleware.js";
import {
  getOverviewStats,
  getVisitsStats,
  getConversionFunnel,
  getUsersGrowth,
  getUsersByRole,
  getRevenueStats,
  getBookingsStatus,
  getTopUnits,
  getBookingsStats,
  adminGetUsers,
  adminGetUserById,
  adminBlockUser,
  adminUnblockUser,
  adminChangeUserRole,
  adminGetBookings,
  adminGetBookingById,
  adminGetVisits,
  adminGetVisitById,
  adminGetReviews,
  adminGetRatingsSummary,
  getVisitsStatus,
} from "./admin.controller.js";

const router = Router();

// Secure all admin routes
router.use(Authenticate, authorizeRoles("ADMIN"));

// 1. Overview & KPIs
router.get("/dashboard/overview", getOverviewStats);
// 2. Visits & Traffic Analytics
router.get("/dashboard/visits-stats", getVisitsStats);
router.get("/charts/visits", getVisitsStats); // Adding charts alias for flexibility as per request
router.get("/dashboard/top-units", getTopUnits);
router.get("/charts/conversion-funnel", getConversionFunnel);
router.get("/charts/visits-status", getVisitsStatus);

// 3. Bookings & Revenue Analytics
router.get("/dashboard/bookings-stats", getBookingsStats);
router.get("/charts/bookings", getBookingsStats); // alias
router.get("/dashboard/revenue-stats", getRevenueStats);
router.get("/charts/revenue", getRevenueStats); // alias
router.get("/charts/bookings-status", getBookingsStatus);

// 4. Users & Growth Charts
router.get("/charts/users-growth", getUsersGrowth);
router.get("/charts/users-by-role", getUsersByRole);

// 5. User & Role Management
router.get("/users", adminGetUsers);
router.get("/users/:id", adminGetUserById);
router.patch("/users/:id/block", adminBlockUser);
router.patch("/users/:id/unblock", adminUnblockUser);
router.patch("/users/:id/role", adminChangeUserRole);

// 6. Bookings Monitoring
router.get("/bookings", adminGetBookings);
router.get("/bookings/:id", adminGetBookingById);

// 7. Visits Monitoring
router.get("/visits", adminGetVisits);
router.get("/visits/:id", adminGetVisitById);

// 8. Reviews & Ratings Analytics
router.get("/reviews", adminGetReviews);
router.get("/dashboard/ratings-summary", adminGetRatingsSummary);

export default router;
