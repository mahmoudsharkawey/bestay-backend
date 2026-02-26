import { z } from "zod";
import AppError from "../../utils/AppError.js";

// Unit validation schema
export const createUnitSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().positive("Price must be positive"),
  city: z.string().min(1, "City is required"),
  address: z.string().min(1, "Address is required"),
  rooms: z.number().int().positive("Rooms must be a positive integer"),
  furnished: z.boolean(),
  university: z.string().min(1, "University is required"),
  distance: z.number().nonnegative("Distance must be non-negative"),
  roomType: z.enum(["SINGLE", "DOUBLE", "SHARED"], {
    errorMap: () => ({
      message: "Room type must be SINGLE, DOUBLE, or SHARED",
    }),
  }),
  genderType: z.enum(["MALE_ONLY", "FEMALE_ONLY"], {
    errorMap: () => ({
      message: "Gender type must be MALE_ONLY or FEMALE_ONLY",
    }),
  }),
  facilities: z.array(z.string()).min(1, "At least one facility is required"),
  ownerId: z.string().uuid("Invalid owner ID"),
  images: z
    .array(
      z
        .string()
        .url("Each image must be a valid URL")
        .refine(
          (url) => {
            const lowerUrl = url.toLowerCase();
            return (
              lowerUrl.endsWith(".jpg") ||
              lowerUrl.endsWith(".jpeg") ||
              lowerUrl.endsWith(".png") ||
              lowerUrl.endsWith(".webp") ||
              lowerUrl.endsWith(".gif")
            );
          },
          {
            message:
              "Image must have a valid file extension (.jpg, .jpeg, .png, .webp, .gif)",
          },
        ),
    )
    .min(1, "At least one valid image URL is required"),
  latitude: z
    .number()
    .min(-90, "Latitude must be >= -90")
    .max(90, "Latitude must be <= 90"),
  longitude: z
    .number()
    .min(-180, "Longitude must be >= -180")
    .max(180, "Longitude must be <= 180"),
});

export const updateUnitSchema = createUnitSchema.partial();

// Validation helper function for creating a unit (all fields required)
export const validateUnitFields = (data) => {
  const result = createUnitSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map(
      (err) => `${err.path.join(".")}: ${err.message}`,
    );
    throw new AppError(errors.join(", "), 400);
  }
  return result.data;
};

// Validation helper function for updating a unit (all fields optional)
export const validateUpdateUnitFields = (data) => {
  const result = updateUnitSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map(
      (err) => `${err.path.join(".")}: ${err.message}`,
    );
    throw new AppError(errors.join(", "), 400);
  }
  return result.data;
};
