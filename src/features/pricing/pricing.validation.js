import { z } from "zod";

/**
 * Validation schema for POST /api/v1/pricing/suggest
 */
export const pricingSuggestionSchema = z.object({
  city: z.string().min(1, "City is required"),
  rooms: z.number().int().positive("Rooms must be a positive integer"),
  roomType: z.enum(["SINGLE", "DOUBLE", "SHARED"], {
    errorMap: () => ({ message: "Room type must be SINGLE, DOUBLE, or SHARED" }),
  }),
  genderType: z.enum(["MALE_ONLY", "FEMALE_ONLY"], {
    errorMap: () => ({ message: "Gender type must be MALE_ONLY or FEMALE_ONLY" }),
  }),
  furnished: z.boolean().optional(),
  facilities: z.array(z.string()).optional(),
  price: z.number().positive("Price must be positive").optional(),
  university: z.string().optional(),
});
