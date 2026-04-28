import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../prisma/client.js", () => ({
  default: {
    unit: { count: vi.fn(), findMany: vi.fn() },
    visit: { count: vi.fn(), findMany: vi.fn() },
    booking: { count: vi.fn(), findMany: vi.fn() },
  },
}));

vi.mock("../../../utils/AppError.js", () => ({
  default: class AppError extends Error {
    constructor(m, c) { super(m); this.statusCode = c; }
  },
}));

import prisma from "../../../prisma/client.js";
import landlordService from "../landlord.service.js";

beforeEach(() => vi.clearAllMocks());

describe("landlordService.getDashboardStats", () => {
  const landlordId = "landlord-123";

  it("returns all dashboard stats for a landlord", async () => {
    prisma.unit.count.mockResolvedValue(5);
    prisma.visit.count.mockResolvedValue(20);
    prisma.booking.count.mockResolvedValue(10);
    prisma.visit.findMany.mockResolvedValue([
      {
        id: "v1",
        user: { id: "u1", name: "John", picture: null },
        unit: { id: "unit1", title: "Studio A" },
      },
    ]);
    prisma.booking.findMany.mockResolvedValue([
      {
        id: "b1",
        user: { id: "u1", name: "John", picture: null },
        unit: { id: "unit1", title: "Studio A" },
      },
    ]);
    prisma.unit.findMany.mockResolvedValue([
      {
        id: "unit1",
        title: "Studio A",
        _count: { visits: 10, bookings: 3 },
      },
    ]);

    const result = await landlordService.getDashboardStats(landlordId);

    expect(result.totalProperties).toBe(5);
    expect(result.totalVisits).toBe(20);
    expect(result.totalBookings).toBe(10);
    expect(result.recentVisits).toHaveLength(1);
    expect(result.recentBookings).toHaveLength(1);
    expect(result.myProperties).toHaveLength(1);
    expect(result.myProperties[0]._count.visits).toBe(10);
  });

  it("returns zeros when landlord has no data", async () => {
    prisma.unit.count.mockResolvedValue(0);
    prisma.visit.count.mockResolvedValue(0);
    prisma.booking.count.mockResolvedValue(0);
    prisma.visit.findMany.mockResolvedValue([]);
    prisma.booking.findMany.mockResolvedValue([]);
    prisma.unit.findMany.mockResolvedValue([]);

    const result = await landlordService.getDashboardStats(landlordId);

    expect(result.totalProperties).toBe(0);
    expect(result.totalVisits).toBe(0);
    expect(result.totalBookings).toBe(0);
    expect(result.recentVisits).toHaveLength(0);
    expect(result.recentBookings).toHaveLength(0);
    expect(result.myProperties).toHaveLength(0);
  });
});
