import httpResponse from "../utils/httpResponse.js";
import httpError from "../utils/httpError.js";
import * as bookingService from "../services/bookingService.js";
import { getErrorStatusCode } from "../utils/errorStatusCode.js";

// GET /bookings/all — Get all bookings for the authenticated user or landlord
export async function getAllBookings(req, res, next) {
  try {
    const userId = req.user.id;
    const bookings = await bookingService.getAllBookingsService(
      userId,
      req.user.role,
    );

    httpResponse(req, res, 200, "Bookings fetched successfully", bookings);
  } catch (error) {
    httpError(next, error, req, getErrorStatusCode(error));
  }
}
