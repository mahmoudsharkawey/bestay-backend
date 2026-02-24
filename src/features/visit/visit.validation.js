import { z } from "zod";

export const createVisitSchema = z.object({
  proposedDate: z.string().datetime("Invalid date format. Use ISO 8601 format"),
});
