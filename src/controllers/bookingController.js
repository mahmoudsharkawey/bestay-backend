import httpResponse from "../utils/httpResponse.js";
import httpError from "../utils/httpError.js";
import * as bookingService from "../services/bookingService.js";
import { env } from "../config/env.js";

export async function createBooking(req, res, next) {
  try {
    const { userId, unitId, visitDate } = req.body;

    const booking = await bookingService.createBookingService(
      userId,
      unitId,
      visitDate,
    );

    httpResponse(req, res, 201, "Booking created successfully", booking);
  } catch (error) {
    httpError(next, error, req, 500);
  }
}

export async function getAllBookings(req, res, next) {
  try {
    const userId = req.user.id; // JWT payload has 'id', not 'userId'
    const bookings = await bookingService.getAllBookingsService(userId);

    httpResponse(req, res, 200, "Bookings fetched successfully", bookings);
  } catch (error) {
    httpError(next, error, req, 500);
  }
}

export async function createPaymentIntent(req, res, next) {
  try {
    const { bookingId } = req.body;
    const userId = req.user.id; // Get userId from authenticated user

    const paymentIntent = await bookingService.createPaymentIntentService(
      bookingId,
      userId,
    );

    httpResponse(
      req,
      res,
      201,
      "Payment intent created successfully",
      paymentIntent,
    );
  } catch (error) {
    httpError(next, error, req, 500);
  }
}

export async function confirmPayment(req, res, next) {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user.id; // JWT payload has 'id', not 'userId'

    const result = await bookingService.confirmPaymentService(
      paymentIntentId,
      userId,
    );

    httpResponse(req, res, 200, "Payment confirmed successfully", result);
  } catch (error) {
    httpError(next, error, req, 500);
  }
}
