import prisma from "../../prisma/client.js";
import AppError from "../../utils/AppError.js";

/**
 * Get dashboard statistics for a specific landlord
 * @param {string} landlordId - The ID of the landlord
 * @returns {Promise<Object>} - Dashboard statistics
 */
export const getDashboardStats = async (landlordId) => {
  // 1. Total Properties
  const totalProperties = await prisma.unit.count({
    where: {
      ownerId: landlordId,
      deletedAt: null,
    },
  });

  // 2. Total Visits & Recent Visits
  const totalVisits = await prisma.visit.count({
    where: {
      unit: {
        ownerId: landlordId,
      },
      deletedAt: null,
    },
  });

  const recentVisits = await prisma.visit.findMany({
    where: {
      unit: {
        ownerId: landlordId,
      },
      deletedAt: null,
    },
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          picture: true,
        },
      },
      unit: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  // 3. Total Bookings & Recent Bookings
  const totalBookings = await prisma.booking.count({
    where: {
      unit: {
        ownerId: landlordId,
      },
      deletedAt: null,
    },
  });

  const recentBookings = await prisma.booking.findMany({
    where: {
      unit: {
        ownerId: landlordId,
      },
      deletedAt: null,
    },
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          picture: true,
        },
      },
      unit: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  // 4. My Properties (Top 5 most recent)
  const myProperties = await prisma.unit.findMany({
    where: {
      ownerId: landlordId,
      deletedAt: null,
    },
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: { visits: true, bookings: true },
      },
    },
  });

  return {
    totalProperties,
    totalVisits,
    totalBookings,
    myProperties,
    recentVisits,
    recentBookings,
  };
};

export default {
  getDashboardStats,
};
