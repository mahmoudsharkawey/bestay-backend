import { z } from "zod";

export const createVisitSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  unitId: z.string().uuid("Invalid unit ID"),
  proposedDate: z.string().datetime("Invalid date format. Use ISO 8601 format"),
});
