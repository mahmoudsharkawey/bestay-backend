import { z } from "zod";

export const createVisitSchema = z.object({
  proposedDate: z.string().datetime("Invalid date format. Use ISO 8601 format"),
});

export const proposeRescheduleSchema = z.object({
  newDate: z.string().datetime("Invalid date format. Use ISO 8601 format"),
});
