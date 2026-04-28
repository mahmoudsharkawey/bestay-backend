import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../prisma/client.js", () => ({
  default: {
    booking: { findMany: vi.fn(), count: vi.fn() },
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
  it("returns user's own bookings for USER role (paginated)", async () => {
    prisma.booking.findMany.mockResolvedValue([{ id: "b1", userId: "usr1" }]);
    prisma.booking.count.mockResolvedValue(1);

    const result = await getAllBookingsService("usr1", "USER");
    expect(result.bookings).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(prisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "usr1" } }),
    );
  });

  it("returns unit bookings for LANDLORD role", async () => {
    prisma.booking.findMany.mockResolvedValue([{ id: "b2" }]);
    prisma.booking.count.mockResolvedValue(1);

    const result = await getAllBookingsService("landlord1", "LANDLORD");
    expect(prisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { unit: { ownerId: "landlord1" } } }),
    );
  });

  it("returns empty array when no bookings", async () => {
    prisma.booking.findMany.mockResolvedValue([]);
    prisma.booking.count.mockResolvedValue(0);

    const result = await getAllBookingsService("usr1", "USER");
    expect(result.bookings).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("respects page and limit params", async () => {
    prisma.booking.findMany.mockResolvedValue([]);
    prisma.booking.count.mockResolvedValue(25);

    const result = await getAllBookingsService("usr1", "USER", 2, 5);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(5);
    expect(result.totalPages).toBe(5);
    expect(prisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 5, take: 5 }),
    );
  });
});
