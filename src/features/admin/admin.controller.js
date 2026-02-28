import adminService from "./admin.service.js";
import httpResponse from "../../utils/httpResponse.js";
import httpError from "../../utils/httpError.js";

// 1. Overview & KPIs
export const getOverviewStats = async (req, res, next) => {
  try {
    const result = await adminService.getOverviewStats();
    httpResponse(req, res, 200, "Overview retrieved successfully", result);
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

// 2. Visits & Traffic Analytics
export const getVisitsStats = async (req, res, next) => {
  try {
    const { period } = req.query; // daily or monthly
    const result = await adminService.getVisitsStats(period);
    httpResponse(req, res, 200, "Visits stats retrieved successfully", result);
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

export const getTopUnits = async (req, res, next) => {
  try {
    const { limit, by } = req.query;
    const result = await adminService.getTopUnits(
      by,
      limit ? parseInt(limit) : 10,
    );
    httpResponse(req, res, 200, "Top units retrieved successfully", result);
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

export const getConversionFunnel = async (req, res, next) => {
  try {
    const result = await adminService.getConversionFunnel();
    httpResponse(
      req,
      res,
      200,
      "Conversion funnel retrieved successfully",
      result,
    );
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

export const getVisitsStatus = async (req, res, next) => {
  try {
    const result = await adminService.getVisitsStatus();
    httpResponse(req, res, 200, "Visits status retrieved successfully", result);
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

// 3. Bookings & Revenue Analytics
export const getBookingsStats = async (req, res, next) => {
  try {
    const { period } = req.query; // monthly
    const result = await adminService.getBookingsStats(period);
    httpResponse(
      req,
      res,
      200,
      "Bookings stats retrieved successfully",
      result,
    );
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

export const getRevenueStats = async (req, res, next) => {
  try {
    const { period } = req.query; // monthly
    const result = await adminService.getRevenueStats(period);
    httpResponse(req, res, 200, "Revenue stats retrieved successfully", result);
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

export const getBookingsStatus = async (req, res, next) => {
  try {
    const result = await adminService.getBookingsStatus();
    httpResponse(
      req,
      res,
      200,
      "Bookings status retrieved successfully",
      result,
    );
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

// 4. Users & Growth Charts
export const getUsersGrowth = async (req, res, next) => {
  try {
    const { period } = req.query; // monthly
    const result = await adminService.getUsersGrowth(period);
    httpResponse(req, res, 200, "Users growth retrieved successfully", result);
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

export const getUsersByRole = async (req, res, next) => {
  try {
    const result = await adminService.getUsersByRole();
    httpResponse(req, res, 200, "Users by role retrieved successfully", result);
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

// 5. User & Role Management
export const adminGetUsers = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await adminService.getUsers(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
    httpResponse(req, res, 200, "Users retrieved successfully", result);
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

export const adminGetUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await adminService.getUserById(id);
    httpResponse(req, res, 200, "User retrieved successfully", result);
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

export const adminBlockUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await adminService.blockUser(id, req.user.id);
    httpResponse(req, res, 200, "User blocked successfully", result);
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

export const adminUnblockUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await adminService.unblockUser(id);
    httpResponse(req, res, 200, "User unblocked successfully", result);
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

export const adminChangeUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const result = await adminService.changeUserRole(id, role);
    httpResponse(req, res, 200, "User role changed successfully", result);
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

// 6. Bookings Monitoring
export const adminGetBookings = async (req, res, next) => {
  try {
    const { page, limit, from, to } = req.query;
    const result = await adminService.getBookings(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      from,
      to,
    );
    httpResponse(req, res, 200, "Bookings retrieved successfully", result);
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

export const adminGetBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await adminService.getBookingById(id);
    httpResponse(req, res, 200, "Booking retrieved successfully", result);
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

// 7. Visits Monitoring
export const adminGetVisits = async (req, res, next) => {
  try {
    const { page, limit, from, to } = req.query;
    const result = await adminService.getVisits(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      from,
      to,
    );
    httpResponse(req, res, 200, "Visits retrieved successfully", result);
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

export const adminGetVisitById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await adminService.getVisitById(id);
    httpResponse(req, res, 200, "Visit retrieved successfully", result);
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

// 8. Reviews & Ratings Analytics
export const adminGetReviews = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await adminService.getReviews(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
    httpResponse(req, res, 200, "Reviews retrieved successfully", result);
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

export const adminGetRatingsSummary = async (req, res, next) => {
  try {
    const result = await adminService.getRatingsSummary();
    httpResponse(
      req,
      res,
      200,
      "Ratings summary retrieved successfully",
      result,
    );
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};
