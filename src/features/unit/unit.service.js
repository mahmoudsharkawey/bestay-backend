import prisma from "../../prisma/client.js";
import { softDelete } from "../../utils/softDelete.js";
import { calculateAverageRating } from "../../utils/rating.js";
import {
  buildWhereClause,
  buildOrderByClause,
} from "../../utils/unitQueryBuilder.js";
import AppError from "../../utils/AppError.js";

// Returns a unit by id
export const createUnit = async (data) => {
  // Logic to create a new unit in the database
  const newUnit = {
    title: data.title,
    description: data.description,
    price: data.price,
    city: data.city,
    address: data.address,
    rooms: data.rooms,
    furnished: data.furnished,
    university: data.university,
    distance: data.distance,
    roomType: data.roomType,
    genderType: data.genderType,
    facilities: data.facilities,
    images: data.images,
    ownerId: data.ownerId,
    latitude: data.latitude,
    longitude: data.longitude,
  };

  const existingUnit = await prisma.unit.findFirst({
    where: {
      address: data.address,
      ownerId: data.ownerId,
      latitude: data.latitude,
      longitude: data.longitude,
    },
  });

  if (existingUnit) {
    throw new AppError("Unit already exists at this address", 409);
  }

  const createdUnit = await prisma.unit.create({
    data: newUnit,
  });
  if (!createdUnit) {
    throw new AppError("Failed to create unit", 500);
  }
  return createdUnit;
};
// Returns a unit by id
export const deleteUnitById = async (id, actorId) => {
  // 1. Fetch unit, confirming it exists and isn't already deleted

  const unit = await prisma.unit.findUnique({
    where: { id },
    include: {
      visits: {
        where: {
          status: {
            in: [
              "PENDING_OWNER",
              "APPROVED",
              "RESCHEDULE_PROPOSED",
              "CONFIRMED",
            ],
          },
        },
      },
      bookings: {
        where: { status: { in: ["BOOKED", "CONFIRMED"] } },
      },
    },
  });
  if (!unit || unit.deletedAt || unit.status === "DELETED") {
    throw new AppError("Unit already deleted", 404);
  }
  // 2. Block if active bookings or visits
  if (unit.visits.length > 0 || unit.bookings.length > 0) {
    throw new AppError(
      "Cannot delete unit with active bookings or visits",
      409,
    );
  }

  // 3. Perform soft delete
  const deletedUnit = await softDelete(prisma.unit, id, actorId, "DELETED");

  return deletedUnit;
};
// Returns a unit by id
export const updateUnitById = async (id, data) => {
  const unit = await prisma.unit.findUnique({
    where: {
      id: id,
      deletedAt: null,
      status: "ACTIVE",
    },
  });

  if (!unit) {
    throw new AppError("Unit not found", 404);
  }

  const updatedUnit = await prisma.unit.update({
    where: {
      id: id,
    },
    data: data,
  });
  if (!updatedUnit) {
    throw new AppError("Failed to update unit", 500);
  }
  return updatedUnit;
};
// Returns a unit by id
export const getUnitById = async (id) => {
  const unit = await prisma.unit.findUnique({
    where: {
      id: id,
    },
    include: {
      owner: {
        select: {
          name: true,
          picture: true,
        },
      },
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              picture: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!unit || unit.deletedAt) {
    throw new AppError("Unit not found", 404);
  }

  // Calculate average rating and review count
  const reviewCount = unit.reviews.length;
  const averageRating = calculateAverageRating(unit.reviews);

  return {
    ...unit,
    reviewCount,
    averageRating: parseFloat(averageRating.toFixed(1)),
  };
};
// Returns all units
export const getAllUnits = async (page, limit) => {
  const units = await prisma.unit.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
    skip: Number((page - 1) * limit),
    take: Number(limit),
    orderBy: { createdAt: "desc" },
  });
  const total = await prisma.unit.count({ where: { deletedAt: null } });
  return { units, total };
};
// Returns all units belonging to the authenticated landlord
export const getMyUnits = async (ownerId) => {
  const units = await prisma.unit.findMany({
    where: { ownerId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { visits: true, bookings: true, reviews: true },
      },
      reviews: { select: { rating: true } },
    },
  });

  if (!units) {
    throw new AppError("Units not found", 404);
  }

  return units.map(({ reviews, _count, ...unit }) => {
    const avgRating = calculateAverageRating(reviews);
    return {
      ...unit,
      reviewCount: _count.reviews,
      visitCount: _count.visits,
      bookingCount: _count.bookings,
      averageRating: avgRating,
    };
  });
};
// Returns units by filter
export const searchUnitsByFilter = async (filters) => {
  const { page, limit, sortBy, sortOrder } = filters;

  const where = buildWhereClause(filters);

  const orderDir = sortOrder === "asc" ? "asc" : "desc";
  const orderBy = buildOrderByClause(sortBy, sortOrder);

  if (sortBy === "rating") {
    // Fetch all matching units to sort them in memory
    const allUnits = await prisma.unit.findMany({
      where,
      include: {
        reviews: { select: { rating: true } },
      },
    });

    const unitsWithRating = allUnits.map((unit) => {
      const avgRating = calculateAverageRating(unit.reviews);
      const { reviews, ...rest } = unit;
      return { ...rest, averageRating: parseFloat(avgRating.toFixed(1)) };
    });

    unitsWithRating.sort((a, b) => {
      return orderDir === "asc"
        ? a.averageRating - b.averageRating
        : b.averageRating - a.averageRating;
    });

    const total = unitsWithRating.length;
    const paginatedUnits = unitsWithRating.slice(
      (page - 1) * limit,
      page * limit,
    );

    return {
      total,
      page,
      pages: Math.ceil(total / limit),
      units: paginatedUnits,
    };
  }

  // Not sorting by rating
  const units = await prisma.unit.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: Object.keys(orderBy).length ? orderBy : { createdAt: "desc" },
    include: {
      reviews: { select: { rating: true } },
    },
  });

  const unitsWithRating = units.map((unit) => {
    const avgRating = calculateAverageRating(unit.reviews);
    const { reviews, ...rest } = unit;
    return { ...rest, averageRating: parseFloat(avgRating.toFixed(1)) };
  });

  const total = await prisma.unit.count({ where });

  return {
    total,
    page,
    pages: Math.ceil(total / limit),
    units: unitsWithRating,
  };
};
