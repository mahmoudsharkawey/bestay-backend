import { z } from "zod";
import AppError from "../../utils/AppError.js";

// User Preference validation schema (all fields required for create/upsert)
export const createPreferenceSchema = z
  .object({
    unitType: z.enum(["ROOM", "APARTMENT", "STUDIO"], {
      errorMap: () => ({
        message: "Unit type must be ROOM, APARTMENT, or STUDIO",
      }),
    }),
    minBudget: z.number().positive("Minimum budget must be positive"),
    maxBudget: z.number().positive("Maximum budget must be positive"),
    city: z.string().min(1, "City is required"),
    university: z.string().optional(),
    maxDistance: z
      .number()
      .nonnegative("Max distance must be non-negative")
      .optional(),
    rooms: z.number().int().positive("Rooms must be a positive integer"),
    furnished: z.boolean(),
    genderType: z.enum(["MALE_ONLY", "FEMALE_ONLY"], {
      errorMap: () => ({
        message: "Gender type must be MALE_ONLY or FEMALE_ONLY",
      }),
    }),
    facilities: z.array(z.string()).default([]),
  })
  .refine((data) => data.minBudget <= data.maxBudget, {
    message: "minBudget must be less than or equal to maxBudget",
    path: ["minBudget"],
  });

// Partial schema for updates — re-apply budget refinement only when both are present
export const updatePreferenceSchema = z
  .object({
    unitType: z
      .enum(["ROOM", "APARTMENT", "STUDIO"], {
        errorMap: () => ({
          message: "Unit type must be ROOM, APARTMENT, or STUDIO",
        }),
      })
      .optional(),
    minBudget: z
      .number()
      .positive("Minimum budget must be positive")
      .optional(),
    maxBudget: z
      .number()
      .positive("Maximum budget must be positive")
      .optional(),
    city: z.string().min(1, "City is required").optional(),
    university: z.string().optional(),
    maxDistance: z
      .number()
      .nonnegative("Max distance must be non-negative")
      .optional(),
    rooms: z
      .number()
      .int()
      .positive("Rooms must be a positive integer")
      .optional(),
    furnished: z.boolean().optional(),
    genderType: z
      .enum(["MALE_ONLY", "FEMALE_ONLY"], {
        errorMap: () => ({
          message: "Gender type must be MALE_ONLY or FEMALE_ONLY",
        }),
      })
      .optional(),
    facilities: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      if (data.minBudget !== undefined && data.maxBudget !== undefined) {
        return data.minBudget <= data.maxBudget;
      }
      return true;
    },
    {
      message: "minBudget must be less than or equal to maxBudget",
      path: ["minBudget"],
    },
  );

// Validation helper function for creating a preference (all fields required)
export const validatePreferenceFields = (data) => {
  const result = createPreferenceSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map(
      (err) => `${err.path.join(".")}: ${err.message}`,
    );
    throw new AppError(errors.join(", "), 400);
  }
  return result.data;
};

// Validation helper function for updating a preference (all fields optional)
export const validateUpdatePreferenceFields = (data) => {
  const result = updatePreferenceSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map(
      (err) => `${err.path.join(".")}: ${err.message}`,
    );
    throw new AppError(errors.join(", "), 400);
  }
  return result.data;
};
