import { z } from "zod";

// No body to validate for GET /bookings/my — but adding a query schema for future pagination
export const bookingsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});
