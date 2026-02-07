export const validateUnitFields = (data) => {
  const {
    title,
    description,
    price,
    city,
    address,
    rooms,
    furnished,
    university,
    distance,
    roomType,
    genderType,
    facilities,
    ownerId,
    images,
    latitude,
    longitude,
    
  } = data;

  if (
    !title ||
    !description ||
    !price ||
    !city ||
    !address ||
    !rooms ||
    !furnished ||
    !university ||
    !distance ||
    !roomType ||
    !genderType ||
    !facilities ||
    !ownerId ||
    !images ||
    !latitude ||
    !longitude
      ) {
    throw new Error("All fields are required");
  }

  if (
    typeof title !== "string" ||
    typeof description !== "string" ||
    typeof price !== "number" ||
    typeof city !== "string" ||
    typeof address !== "string" ||
    typeof rooms !== "number" ||
    typeof furnished !== "boolean" ||
    typeof university !== "string" ||
    typeof distance !== "number" ||
    typeof roomType !== "string" ||
    typeof genderType !== "string" ||
    typeof facilities !== "object" ||
    typeof ownerId !== "string" ||
    typeof images !== "object" ||
    typeof latitude !== "number" ||
    typeof longitude !== "number"
  ) {
    throw new Error("Invalid field types");
  }

  if (price < 0 || rooms < 0 || distance < 0 || latitude < 0 || longitude < 0) {
    throw new Error("Invalid field values");
  }

  if (typeof facilities !== "object" || typeof images !== "object") {
    throw new Error("Invalid field types");
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new Error("Invalid latitude or longitude");
  }

  
};
