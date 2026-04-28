import prisma from "../../prisma/client.js";
import AppError from "../../utils/AppError.js";

// USER → their own bookings | LANDLORD → bookings on their units
export async function getAllBookingsService(userId, role, page = 1, limit = 10) {
  const where =
    role === "LANDLORD" ? { unit: { ownerId: userId } } : { userId };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        unit: { select: { id: true, title: true, city: true, images: true } },
        visit: { select: { id: true, proposedDate: true, status: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    bookings,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

