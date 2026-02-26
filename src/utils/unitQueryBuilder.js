export const buildWhereClause = (filters) => {
  const {
    city,
    university,
    minPrice,
    maxPrice,
    roomType,
    genderType,
    facilities,
  } = filters;

  const where = {
    status: "ACTIVE",
    deletedAt: null,
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

  return where;
};

export const buildOrderByClause = (sortBy, sortOrder) => {
  const orderDir = sortOrder === "asc" ? "asc" : "desc";
  let orderBy = {};

  if (sortBy === "price") orderBy.price = orderDir;
  else if (sortBy === "distance") orderBy.distance = orderDir;
  else if (sortBy === "createdAt") orderBy.createdAt = orderDir;
  else if (sortBy === "rating") orderBy.averageRating = orderDir;

  return orderBy;
};
