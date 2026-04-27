import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../prisma/client.js", () => ({
  default: {
    booking: { findMany: vi.fn() },
  },
}));
vi.mock("../../../utils/AppError.js", () => ({
  default: class AppError extends Error {
    constructor(m, c) { super(m); this.statusCode = c; }
  },
}));

import prisma from "../../../prisma/client.js";
import { getAllBookingsService } from "../booking.service.js";

beforeEach(() => vi.clearAllMocks());

describe("getAllBookingsService", () => {
  it("returns user's own bookings for USER role", async () => {
    prisma.booking.findMany.mockResolvedValue([{ id: "b1", userId: "usr1" }]);

    const result = await getAllBookingsService("usr1", "USER");
    expect(result).toHaveLength(1);
    expect(prisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "usr1" } }),
    );
  });

  it("returns unit bookings for LANDLORD role", async () => {
    prisma.booking.findMany.mockResolvedValue([{ id: "b2" }]);

    const result = await getAllBookingsService("landlord1", "LANDLORD");
    expect(prisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { unit: { ownerId: "landlord1" } } }),
    );
  });

  it("returns empty array when no bookings", async () => {
    prisma.booking.findMany.mockResolvedValue([]);

    const result = await getAllBookingsService("usr1", "USER");
    expect(result).toHaveLength(0);
  });
});
