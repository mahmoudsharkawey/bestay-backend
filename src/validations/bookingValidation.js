import { z } from "zod";

// Booking validation schemas
export const createBookingSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  unitId: z.string().uuid("Invalid unit ID"),
  visitDate: z.string().datetime().optional(),
});

export const createPaymentIntentSchema = z.object({
  bookingId: z.string().uuid("Invalid booking ID"),
});

export const confirmPaymentSchema = z.object({
  paymentIntentId: z.string().min(1, "Payment intent ID is required"),
});
