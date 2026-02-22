import prisma from "../prisma/client.js";

// USER → their own bookings | LANDLORD → bookings on their units
export async function getAllBookingsService(userId, role) {
  const where =
    role === "LANDLORD" ? { unit: { ownerId: userId } } : { userId };

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      unit: { select: { id: true, title: true, city: true, images: true } },
      visit: { select: { id: true, proposedDate: true, status: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return bookings;
}
