import prisma from "../prisma/client.js";

export async function createBookingService(visitId, userId) {
  // Fetch the visit and verify it belongs to the authenticated user
  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
  });

  if (!visit) {
    throw new Error("Visit not found");
  }

  if (visit.userId !== userId) {
    throw new Error("Unauthorized: This visit does not belong to you");
  }

  // Only allow booking creation when the visit is CONFIRMED
  if (visit.status !== "CONFIRMED") {
    throw new Error(
      `Cannot create a booking for a visit with status: ${visit.status}`,
    );
  }

  // Prevent duplicate bookings for the same visit
  const existingBooking = await prisma.booking.findUnique({
    where: { visitId },
  });

  if (existingBooking) {
    throw new Error("A booking already exists for this visit");
  }

  // Create the booking
  const booking = await prisma.booking.create({
    data: {
      userId: visit.userId,
      unitId: visit.unitId,
      visitId: visit.id,
      status: "BOOKED",
    },
    include: {
      visit: true,
      unit: true,
    },
  });

  return booking;
}

export async function getAllBookingsService(userId) {
  const bookings = await prisma.booking.findMany({
    where: { userId },
    include: {
      unit: true,
      visit: true,
    },
  });

  return bookings;
}
