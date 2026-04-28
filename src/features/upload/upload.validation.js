import { z } from "zod";

// POST /uploads — validated after multer parses the files.
// This validates the optional "context" body field.
export const uploadSchema = z.object({
  context: z
    .string()
    .max(50, "Context cannot exceed 50 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Context must only contain letters, numbers, and underscores",
    )
    .optional()
    .default("general"),
});
