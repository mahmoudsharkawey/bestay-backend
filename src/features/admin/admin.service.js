import prisma from "../../prisma/client.js";
import AppError from "../../utils/AppError.js";

function getPeriodFormat(period) {
  // Returns postgres date truncation string mapped from period
  return period === "daily" ? "day" : "month";
}

// 1. Overview & KPIs
export const getOverviewStats = async () => {
  const usersCount = await prisma.user.count();
  const landlordsCount = await prisma.user.count({
    where: { role: "LANDLORD" },
  });
  const unitsCount = await prisma.unit.count();
  const bookingsCount = await prisma.booking.count();
  const totalVisits = await prisma.visit.count();

  const revenueResult = await prisma.payment.aggregate({
    where: { status: "PAID" },
    _sum: { amount: true },
  });

  // Note: amount is stored in cents/piastres usually, we might want to return it as-is or divided by 100
  const totalRevenue = revenueResult._sum.amount
    ? revenueResult._sum.amount / 100
    : 0;

  return {
    usersCount,
    landlordsCount,
    unitsCount,
    bookingsCount,
    totalRevenue,
    totalVisits,
  };
};

// 2. Visits & Traffic Analytics
export const getVisitsStats = async (period = "monthly") => {
  const format = getPeriodFormat(period);

  // PostgreSQL-specific grouping query
  const result = await prisma.$queryRaw`
    SELECT date_trunc(${format}, "createdAt") as date, count(id) as count
    FROM "Visit"
    GROUP BY date
    ORDER BY date ASC
  `;

  return {
    labels: result.map((r) => r.date.toISOString().split("T")[0]),
    data: result.map((r) => Number(r.count)),
  };
};

export const getTopUnits = async (by = "visits", limit = 10) => {
  if (by !== "visits") {
    throw new AppError(
      "Currently we only support grouping top units by visits",
      400,
    );
  }

  const units = await prisma.unit.findMany({
    take: limit,
    orderBy: {
      visits: {
        _count: "desc",
      },
    },
    select: {
      id: true,
      title: true,
      _count: {
        select: { visits: true },
      },
    },
  });

  return units.map((u) => ({
    unitId: u.id,
    title: u.title,
    visits: u._count.visits,
  }));
};

export const getConversionFunnel = async () => {
  const visitsCount = await prisma.visit.count();
  const bookingsCount = await prisma.booking.count();

  return {
    labels: ["Total Visits", "Converted to Bookings"],
    data: [visitsCount, bookingsCount],
  };
};

export const getVisitsStatus = async () => {
  const result = await prisma.visit.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  return {
    labels: result.map((r) => r.status),
    data: result.map((r) => r._count.id),
  };
};

// 3. Bookings & Revenue Analytics
export const getBookingsStats = async (period = "monthly") => {
  const format = getPeriodFormat(period);

  const result = await prisma.$queryRaw`
    SELECT date_trunc(${format}, "createdAt") as date, count(id) as count
    FROM "Booking"
    GROUP BY date
    ORDER BY date ASC
  `;

  return {
    labels: result.map((r) => r.date.toISOString().split("T")[0]),
    data: result.map((r) => Number(r.count)),
  };
};

export const getRevenueStats = async (period = "monthly") => {
  const format = getPeriodFormat(period);

  const result = await prisma.$queryRaw`
    SELECT date_trunc(${format}, "createdAt") as date, sum(amount) as total
    FROM "Payment"
    WHERE status = 'PAID'
    GROUP BY date
    ORDER BY date ASC
  `;
  if (period === "daily") {
    return {
      labels: result.map((r) => r.date.toISOString().split("T")[0]),
      // Divide by 100 since amount is in piastres/cents
      data: result.map((r) => (Number(r.total) || 0) / 100),
    };
  }
  return {
    labels: result.map((r) => r.date.toISOString().split("T")[0]),
    // Divide by 100 since amount is in piastres/cents
    data: result.map((r) => (Number(r.total) || 0) / 100),
  };
};

export const getBookingsStatus = async () => {
  const result = await prisma.booking.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  return {
    labels: result.map((r) => r.status),
    data: result.map((r) => r._count.id),
  };
};

// 4. Users & Growth Charts
export const getUsersGrowth = async (period = "monthly") => {
  const format = getPeriodFormat(period);

  const result = await prisma.$queryRaw`
    SELECT date_trunc(${format}, "createdAt") as date, count(id) as count
    FROM "User"
    GROUP BY date
    ORDER BY date ASC
  `;

  return {
    labels: result.map((r) => r.date.toISOString().split("T")[0]),
    data: result.map((r) => Number(r.count)),
  };
};

export const getUsersByRole = async () => {
  const result = await prisma.user.groupBy({
    by: ["role"],
    _count: { id: true },
  });

  return {
    labels: result.map((r) => r.role),
    data: result.map((r) => r._count.id),
  };
};

// 5. User & Role Management
export const getUsers = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    prisma.user.findMany({ skip, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.user.count(),
  ]);

  return {
    users,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          units: true,
          bookings: true,
          visits: true,
          reviews: true,
        },
      },
    },
  });

  if (!user) throw new AppError("User not found", 404);
  return user;
};

export const blockUser = async (id, adminId) => {
  if (id === adminId) throw new AppError("Cannot block yourself", 400);

  const user = await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date(), deletedById: adminId },
  });
  return { message: "User blocked successfully", user };
};

export const unblockUser = async (id) => {
  const user = await prisma.user.update({
    where: { id },
    data: { deletedAt: null, deletedById: null },
  });
  return { message: "User unblocked successfully", user };
};

export const changeUserRole = async (id, role) => {
  if (!["USER", "LANDLORD", "ADMIN"].includes(role)) {
    throw new AppError("Invalid role", 400);
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role },
  });
  return { message: "Role updated successfully", user };
};

// 6. Bookings Monitoring
const buildDateFilter = (from, to) => {
  const filter = {};
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.gte = new Date(from);
    if (to) filter.createdAt.lte = new Date(to);
  }
  return filter;
};

export const getBookings = async (page = 1, limit = 10, from, to) => {
  const skip = (page - 1) * limit;
  const where = buildDateFilter(from, to);

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        unit: { select: { id: true, title: true } },
      },
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    bookings,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getBookingById = async (id) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      unit: true,
      visit: true,
      payment: true,
    },
  });

  if (!booking) throw new AppError("Booking not found", 404);
  return booking;
};

// 7. Visits Monitoring
export const getVisits = async (page = 1, limit = 10, from, to) => {
  const skip = (page - 1) * limit;
  const where = buildDateFilter(from, to);

  const [visits, total] = await Promise.all([
    prisma.visit.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        unit: { select: { id: true, title: true } },
      },
    }),
    prisma.visit.count({ where }),
  ]);

  return {
    visits,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getVisitById = async (id) => {
  const visit = await prisma.visit.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      unit: true,
      payment: true,
      booking: true,
    },
  });

  if (!visit) throw new AppError("Visit not found", 404);
  return visit;
};

// 8. Reviews & Ratings Analytics
export const getReviews = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true } },
        unit: { select: { id: true, title: true } },
      },
    }),
    prisma.review.count(),
  ]);

  return {
    reviews,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getRatingsSummary = async () => {
  const result = await prisma.review.aggregate({
    _avg: { rating: true },
    _count: { id: true },
  });

  return {
    averageRating: result._avg.rating || 0,
    totalReviews: result._count.id,
  };
};

export default {
  getOverviewStats,
  getVisitsStats,
  getTopUnits,
  getConversionFunnel,
  getVisitsStatus,
  getBookingsStats,
  getRevenueStats,
  getBookingsStatus,
  getUsersGrowth,
  getUsersByRole,
  getUsers,
  getUserById,
  blockUser,
  unblockUser,
  changeUserRole,
  getBookings,
  getBookingById,
  getVisits,
  getVisitById,
  getReviews,
  getRatingsSummary,
};
