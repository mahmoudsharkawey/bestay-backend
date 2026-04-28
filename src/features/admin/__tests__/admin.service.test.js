import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../prisma/client.js", () => ({
  default: {
    user: { count: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), groupBy: vi.fn() },
    unit: { count: vi.fn(), findMany: vi.fn() },
    booking: { count: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), groupBy: vi.fn() },
    visit: { count: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), groupBy: vi.fn() },
    payment: { aggregate: vi.fn() },
    review: { findMany: vi.fn(), count: vi.fn(), aggregate: vi.fn() },
    $queryRaw: vi.fn(),
  },
}));

vi.mock("../../../utils/AppError.js", () => ({
  default: class AppError extends Error {
    constructor(m, c) { super(m); this.statusCode = c; }
  },
}));

import prisma from "../../../prisma/client.js";
import adminService from "../admin.service.js";

beforeEach(() => vi.clearAllMocks());

// ── 1. Overview & KPIs ──────────────────────────────────
describe("adminService.getOverviewStats", () => {
  it("returns aggregated KPI stats", async () => {
    prisma.user.count.mockResolvedValueOnce(100).mockResolvedValueOnce(20);
    prisma.unit.count.mockResolvedValue(50);
    prisma.booking.count.mockResolvedValue(30);
    prisma.visit.count.mockResolvedValue(200);
    prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 500000 } });

    const result = await adminService.getOverviewStats();

    expect(result.usersCount).toBe(100);
    expect(result.landlordsCount).toBe(20);
    expect(result.unitsCount).toBe(50);
    expect(result.bookingsCount).toBe(30);
    expect(result.totalVisits).toBe(200);
    expect(result.totalRevenue).toBe(5000);
  });

  it("returns 0 revenue when no payments", async () => {
    prisma.user.count.mockResolvedValue(0);
    prisma.unit.count.mockResolvedValue(0);
    prisma.booking.count.mockResolvedValue(0);
    prisma.visit.count.mockResolvedValue(0);
    prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: null } });

    const result = await adminService.getOverviewStats();
    expect(result.totalRevenue).toBe(0);
  });
});

// ── 2. Conversion Funnel ──────────────────────────────────
describe("adminService.getConversionFunnel", () => {
  it("returns visit-to-booking funnel", async () => {
    prisma.visit.count.mockResolvedValue(100);
    prisma.booking.count.mockResolvedValue(25);

    const result = await adminService.getConversionFunnel();
    expect(result.labels).toEqual(["Total Visits", "Converted to Bookings"]);
    expect(result.data).toEqual([100, 25]);
  });
});

// ── 3. Users By Role ──────────────────────────────────
describe("adminService.getUsersByRole", () => {
  it("returns user distribution by role", async () => {
    prisma.user.groupBy.mockResolvedValue([
      { role: "USER", _count: { id: 80 } },
      { role: "LANDLORD", _count: { id: 15 } },
      { role: "ADMIN", _count: { id: 5 } },
    ]);

    const result = await adminService.getUsersByRole();
    expect(result.labels).toEqual(["USER", "LANDLORD", "ADMIN"]);
    expect(result.data).toEqual([80, 15, 5]);
  });
});

// ── 4. Get Users (paginated) ──────────────────────────────────
describe("adminService.getUsers", () => {
  it("returns paginated user list", async () => {
    prisma.user.findMany.mockResolvedValue([{ id: "u1" }, { id: "u2" }]);
    prisma.user.count.mockResolvedValue(50);

    const result = await adminService.getUsers(1, 10);
    expect(result.users).toHaveLength(2);
    expect(result.meta.total).toBe(50);
    expect(result.meta.totalPages).toBe(5);
  });
});

// ── 5. Get User By ID ──────────────────────────────────
describe("adminService.getUserById", () => {
  it("returns a user with counts", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      name: "Test",
      _count: { units: 2, bookings: 3, visits: 5, reviews: 1 },
    });

    const result = await adminService.getUserById("u1");
    expect(result.id).toBe("u1");
    expect(result._count.units).toBe(2);
  });

  it("throws 404 when user not found", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(adminService.getUserById("bad")).rejects.toThrow("User not found");
  });
});

// ── 6. Block / Unblock User ──────────────────────────────────
describe("adminService.blockUser", () => {
  it("blocks a user", async () => {
    prisma.user.update.mockResolvedValue({ id: "u1", deletedAt: new Date() });
    const result = await adminService.blockUser("u1", "admin1");
    expect(result.message).toBe("User blocked successfully");
  });

  it("throws when trying to block yourself", async () => {
    await expect(adminService.blockUser("admin1", "admin1")).rejects.toThrow(
      "Cannot block yourself",
    );
  });
});

describe("adminService.unblockUser", () => {
  it("unblocks a user", async () => {
    prisma.user.update.mockResolvedValue({ id: "u1", deletedAt: null });
    const result = await adminService.unblockUser("u1");
    expect(result.message).toBe("User unblocked successfully");
  });
});

// ── 7. Change User Role ──────────────────────────────────
describe("adminService.changeUserRole", () => {
  it("changes role to LANDLORD", async () => {
    prisma.user.update.mockResolvedValue({ id: "u1", role: "LANDLORD" });
    const result = await adminService.changeUserRole("u1", "LANDLORD");
    expect(result.user.role).toBe("LANDLORD");
  });

  it("throws on invalid role", async () => {
    await expect(
      adminService.changeUserRole("u1", "SUPERADMIN"),
    ).rejects.toThrow("Invalid role");
  });
});

// ── 8. Get Booking By ID ──────────────────────────────────
describe("adminService.getBookingById", () => {
  it("returns a booking", async () => {
    prisma.booking.findUnique.mockResolvedValue({ id: "b1", status: "BOOKED" });
    const result = await adminService.getBookingById("b1");
    expect(result.id).toBe("b1");
  });

  it("throws 404 when booking not found", async () => {
    prisma.booking.findUnique.mockResolvedValue(null);
    await expect(adminService.getBookingById("bad")).rejects.toThrow("Booking not found");
  });
});

// ── 9. Get Visit By ID ──────────────────────────────────
describe("adminService.getVisitById", () => {
  it("returns a visit", async () => {
    prisma.visit.findUnique.mockResolvedValue({ id: "v1", status: "APPROVED" });
    const result = await adminService.getVisitById("v1");
    expect(result.id).toBe("v1");
  });

  it("throws 404 when visit not found", async () => {
    prisma.visit.findUnique.mockResolvedValue(null);
    await expect(adminService.getVisitById("bad")).rejects.toThrow("Visit not found");
  });
});

// ── 10. Ratings Summary ──────────────────────────────────
describe("adminService.getRatingsSummary", () => {
  it("returns rating aggregate", async () => {
    prisma.review.aggregate.mockResolvedValue({
      _avg: { rating: 4.2 },
      _count: { id: 100 },
    });

    const result = await adminService.getRatingsSummary();
    expect(result.averageRating).toBe(4.2);
    expect(result.totalReviews).toBe(100);
  });

  it("returns 0 when no reviews", async () => {
    prisma.review.aggregate.mockResolvedValue({
      _avg: { rating: null },
      _count: { id: 0 },
    });

    const result = await adminService.getRatingsSummary();
    expect(result.averageRating).toBe(0);
    expect(result.totalReviews).toBe(0);
  });
});

// ── 11. Visits Status (groupBy) ──────────────────────────────────
describe("adminService.getVisitsStatus", () => {
  it("returns visit count per status", async () => {
    prisma.visit.groupBy.mockResolvedValue([
      { status: "PENDING_OWNER", _count: { id: 10 } },
      { status: "APPROVED", _count: { id: 5 } },
      { status: "CONFIRMED", _count: { id: 3 } },
    ]);

    const result = await adminService.getVisitsStatus();
    expect(result.labels).toEqual(["PENDING_OWNER", "APPROVED", "CONFIRMED"]);
    expect(result.data).toEqual([10, 5, 3]);
  });
});

// ── 12. Bookings Status (groupBy) ──────────────────────────────────
describe("adminService.getBookingsStatus", () => {
  it("returns booking count per status", async () => {
    prisma.booking.groupBy.mockResolvedValue([
      { status: "BOOKED", _count: { id: 20 } },
      { status: "CONFIRMED", _count: { id: 10 } },
    ]);

    const result = await adminService.getBookingsStatus();
    expect(result.labels).toEqual(["BOOKED", "CONFIRMED"]);
    expect(result.data).toEqual([20, 10]);
  });
});

// ── 13. Top Units ──────────────────────────────────
describe("adminService.getTopUnits", () => {
  it("returns top units by visits", async () => {
    prisma.unit.findMany.mockResolvedValue([
      { id: "u1", title: "Unit 1", _count: { visits: 50 } },
      { id: "u2", title: "Unit 2", _count: { visits: 30 } },
    ]);

    const result = await adminService.getTopUnits("visits", 5);
    expect(result).toHaveLength(2);
    expect(result[0].visits).toBe(50);
  });

  it("throws on unsupported grouping", async () => {
    await expect(adminService.getTopUnits("revenue")).rejects.toThrow(
      "Currently we only support grouping top units by visits",
    );
  });
});
