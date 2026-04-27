import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../prisma/client.js", () => ({
  default: {
    unit: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    user: { findUnique: vi.fn() },
    favorite: { findFirst: vi.fn() },
    visit: { findFirst: vi.fn() },
  },
}));
vi.mock("../../../utils/softDelete.js", () => ({ softDelete: vi.fn() }));
vi.mock("../../../utils/rating.js", () => ({ calculateAverageRating: vi.fn(() => 4.5) }));
vi.mock("../../../utils/unitQueryBuilder.js", () => ({
  buildWhereClause: vi.fn(() => ({})),
  buildOrderByClause: vi.fn(() => ({})),
}));
vi.mock("../../../utils/AppError.js", () => ({
  default: class AppError extends Error {
    constructor(m, c) { super(m); this.statusCode = c; }
  },
}));

import prisma from "../../../prisma/client.js";
import { softDelete } from "../../../utils/softDelete.js";
import * as unitService from "../unit.service.js";

beforeEach(() => vi.clearAllMocks());

describe("unitService.createUnit", () => {
  it("creates a unit successfully", async () => {
    prisma.unit.findFirst.mockResolvedValue(null);
    prisma.unit.create.mockResolvedValue({ id: "u1", title: "Nice Flat" });

    const result = await unitService.createUnit({
      title: "Nice Flat", description: "Desc", price: 3000, city: "Cairo",
      address: "123 St", rooms: 2, furnished: true, roomType: "SINGLE",
      genderType: "MALE_ONLY", facilities: [], images: [], ownerId: "o1",
    });
    expect(result.id).toBe("u1");
  });

  it("throws 409 on duplicate address", async () => {
    prisma.unit.findFirst.mockResolvedValue({ id: "existing" });
    await expect(
      unitService.createUnit({ address: "123 St", ownerId: "o1" }),
    ).rejects.toThrow("Unit already exists at this address");
  });
});

describe("unitService.getUnitById", () => {
  it("returns unit with ratings and favorite status", async () => {
    prisma.unit.findUnique.mockResolvedValue({
      id: "u1", deletedAt: null, reviews: [{ rating: 5 }],
    });
    prisma.favorite.findFirst.mockResolvedValue(null);
    prisma.visit.findFirst.mockResolvedValue(null);

    const result = await unitService.getUnitById("u1", "user1");
    expect(result.id).toBe("u1");
    expect(result.isFavorite).toBe(false);
  });

  it("throws 404 when unit not found", async () => {
    prisma.unit.findUnique.mockResolvedValue(null);
    await expect(unitService.getUnitById("bad", "user1")).rejects.toThrow("Unit not found");
  });
});

describe("unitService.updateUnitById", () => {
  it("updates a unit", async () => {
    prisma.unit.findUnique.mockResolvedValue({ id: "u1", deletedAt: null, status: "ACTIVE" });
    prisma.unit.update.mockResolvedValue({ id: "u1", title: "Updated" });

    const result = await unitService.updateUnitById("u1", { title: "Updated" });
    expect(result.title).toBe("Updated");
  });

  it("throws 404 when unit not found", async () => {
    prisma.unit.findUnique.mockResolvedValue(null);
    await expect(unitService.updateUnitById("bad", {})).rejects.toThrow("Unit not found");
  });
});

describe("unitService.deleteUnitById", () => {
  it("soft-deletes unit with no active bookings/visits", async () => {
    prisma.unit.findUnique.mockResolvedValue({
      id: "u1", deletedAt: null, status: "ACTIVE", visits: [], bookings: [],
    });
    softDelete.mockResolvedValue({ id: "u1", deletedAt: new Date() });

    const result = await unitService.deleteUnitById("u1", "o1");
    expect(softDelete).toHaveBeenCalled();
  });

  it("throws 409 when active visits exist", async () => {
    prisma.unit.findUnique.mockResolvedValue({
      id: "u1", deletedAt: null, status: "ACTIVE",
      visits: [{ id: "v1" }], bookings: [],
    });
    await expect(unitService.deleteUnitById("u1", "o1")).rejects.toThrow(
      "Cannot delete unit with active bookings or visits",
    );
  });
});

describe("unitService.getAllUnits", () => {
  it("returns paginated units", async () => {
    prisma.unit.findMany.mockResolvedValue([{ id: "u1" }]);
    prisma.unit.count.mockResolvedValue(1);

    const result = await unitService.getAllUnits(1, 10);
    expect(result.units).toHaveLength(1);
    expect(result.total).toBe(1);
  });
});

describe("unitService.getMyUnits", () => {
  it("returns landlord units with stats", async () => {
    prisma.unit.findMany.mockResolvedValue([{
      id: "u1", reviews: [{ rating: 5 }],
      _count: { reviews: 1, visits: 2, bookings: 3 },
    }]);

    const result = await unitService.getMyUnits("o1");
    expect(result).toHaveLength(1);
    expect(result[0].visitCount).toBe(2);
  });
});

describe("unitService.searchUnitsByFilter", () => {
  it("returns filtered units with pagination", async () => {
    prisma.unit.findMany.mockResolvedValue([{ id: "u1" }]);
    prisma.unit.count.mockResolvedValue(1);

    const result = await unitService.searchUnitsByFilter({
      page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc",
    });
    expect(result.total).toBe(1);
    expect(result.units).toHaveLength(1);
  });
});
