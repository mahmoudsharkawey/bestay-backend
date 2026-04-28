import { z } from "zod";

// POST /payments/intent — body: { visitId }
export const createPaymentIntentSchema = z.object({
  visitId: z.string().uuid("Invalid visit ID format"),
});

// Query params for GET /payments (admin)
export const listPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});
