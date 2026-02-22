import httpResponse from "../utils/httpResponse.js";
import httpError from "../utils/httpError.js";
import * as bookingService from "../services/bookingService.js";
import { getErrorStatusCode } from "../utils/errorStatusCode.js";

// POST /bookings — Create a booking from a confirmed visit
export async function createBooking(req, res, next) {
  try {
    const { visitId } = req.body;
    const userId = req.user.id;

    const booking = await bookingService.createBookingService(visitId, userId);

    httpResponse(req, res, 201, "Booking created successfully", booking);
  } catch (error) {
    httpError(next, error, req, getErrorStatusCode(error));
  }
}

// GET /bookings/all — Get all bookings for the authenticated user
export async function getAllBookings(req, res, next) {
  try {
    const userId = req.user.id;
    const bookings = await bookingService.getAllBookingsService(userId);

    httpResponse(req, res, 200, "Bookings fetched successfully", bookings);
  } catch (error) {
    httpError(next, error, req, getErrorStatusCode(error));
  }
}
