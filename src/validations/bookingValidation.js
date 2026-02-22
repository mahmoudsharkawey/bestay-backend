import { z } from "zod";

export const createBookingSchema = z.object({
  visitId: z.string().uuid("Invalid visit ID"),
});
