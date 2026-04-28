import { z } from "zod";

// POST /favorites — body: { userId, unitId }
export const addFavoriteSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
  unitId: z.string().uuid("Invalid unit ID format"),
});

// DELETE /favorites/:unitId — body: { userId }
export const removeFavoriteSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
});
