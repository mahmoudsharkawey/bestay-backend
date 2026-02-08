import prisma from "../prisma/client.js";

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
      ownerId: data.ownerId,
      latitude: data.latitude,
      longitude: data.longitude,
      facilities: {
        equals: data.facilities,
      },
      images: {
        equals: data.images,
      },
    },
  });

  if (existingUnit) {
    throw new Error("Unit already exists at this address");
  }

  const createdUnit = await prisma.unit.create({
    data: newUnit,
  });
  if (!createdUnit) {
    throw new Error("Failed to create unit");
  }
  return createdUnit;
};

export const deleteUnitById = async (id) => {
  const unit = await prisma.unit.findUnique({
    where: {
      id: id,
    },
  });

  if (!unit) {
    throw new Error("Unit not found");
  }

  const deletedUnit = await prisma.unit.delete({
    where: {
      id: id,
    },
  });
  if (!deletedUnit) {
    throw new Error("Failed to delete unit");
  }
  return deletedUnit;
};

export const updateUnitById = async (id, data) => {
  const unit = await prisma.unit.findUnique({
    where: {
      id: id,
    },
  });

  if (!unit) {
    throw new Error("Unit not found");
  }

  const updatedUnit = await prisma.unit.update({
    where: {
      id: id,
    },
    data: data,
  });
  if (!updatedUnit) {
    throw new Error("Failed to update unit");
  }
  return updatedUnit;
};

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


  if (!unit) {
    throw new Error("Unit not found");
  }

  // Calculate average rating and review count
  const reviewCount = unit.reviews.length;
  const averageRating =
    reviewCount > 0
      ? unit.reviews.reduce((sum, review) => sum + review.rating, 0) /
        reviewCount
      : 0;

  return {
    ...unit,
    reviewCount,
    averageRating: parseFloat(averageRating.toFixed(1)),
  };
};

export const getAllUnits = async () => {
  const units = await prisma.unit.findMany();
  return units;
};

export const searchUnitsByFilter = async (filters) => {
  const {
    city,
    university,
    minPrice,
    maxPrice,
    roomType,
    genderType,
    facilities,
    page,
    limit,
  } = filters;

  const where = {
    isAvailable: true,
  };

  if (city) where.city = city;
  if (university) where.university = university;
  if (roomType) where.roomType = roomType;
  if (genderType) where.genderType = genderType;

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }

  if (facilities) {
    where.facilities = {
      hasEvery: facilities.split(","),
    };
  }

  const units = await prisma.unit.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  const total = await prisma.unit.count({ where });

  return {
    total,
    page,
    pages: Math.ceil(total / limit),
    units,
  };
};
