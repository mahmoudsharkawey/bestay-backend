import { z } from "zod";

export const createReviewSchema = z.object({
  unitId: z.string().uuid("Invalid unit ID format"),
  rating: z
    .number()
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5"),
  comment: z
    .string()
    .max(1000, "Comment cannot exceed 1000 characters")
    .optional(),
});

export const updateReviewSchema = z.object({
  rating: z
    .number()
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5")
    .optional(),
  comment: z
    .string()
    .max(1000, "Comment cannot exceed 1000 characters")
    .optional(),
});
