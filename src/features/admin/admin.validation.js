import { z } from "zod";

// PATCH /admin/users/:id/role — body: { role }
export const changeRoleSchema = z.object({
  role: z.enum(["USER", "LANDLORD", "ADMIN"], {
    errorMap: () => ({
      message: "Role must be USER, LANDLORD, or ADMIN",
    }),
  }),
});

// Query params shared by paginated admin endpoints
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

// Query params for admin endpoints with date filtering
export const dateFilterQuerySchema = paginationQuerySchema.extend({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
});

// Query params for period-based chart endpoints
export const periodQuerySchema = z.object({
  period: z.enum(["daily", "monthly"]).default("monthly"),
});

// Query params for GET /admin/dashboard/top-units
export const topUnitsQuerySchema = z.object({
  by: z.enum(["visits", "bookings"]).default("visits"),
  limit: z.coerce.number().int().positive().max(50).default(10),
});
