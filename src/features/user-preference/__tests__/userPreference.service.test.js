import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../prisma/client.js", () => ({
  default: {
    userPreference: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: { findUnique: vi.fn() },
    unit: { findMany: vi.fn() },
  },
}));
vi.mock("../../../utils/AppError.js", () => ({
  default: class AppError extends Error {
    constructor(m, c) { super(m); this.statusCode = c; }
  },
}));

import prisma from "../../../prisma/client.js";
import * as prefService from "../userPreference.service.js";

beforeEach(() => vi.clearAllMocks());

describe("prefService.upsertPreference", () => {
  it("creates/updates a preference", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "usr1" });
    prisma.userPreference.upsert.mockResolvedValue({ city: "Cairo" });

    const result = await prefService.upsertPreference("usr1", { city: "Cairo" });
    expect(result.city).toBe("Cairo");
  });

  it("throws 404 when user not found", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      prefService.upsertPreference("bad", {}),
    ).rejects.toThrow("User not found");
  });
});

describe("prefService.getPreference", () => {
  it("returns preference when found", async () => {
    prisma.userPreference.findUnique.mockResolvedValue({ city: "Alex" });
    const result = await prefService.getPreference("usr1");
    expect(result.city).toBe("Alex");
  });

  it("throws 404 when not found", async () => {
    prisma.userPreference.findUnique.mockResolvedValue(null);
    await expect(prefService.getPreference("usr1")).rejects.toThrow("Preference not found");
  });
});

describe("prefService.updatePreference", () => {
  it("updates preference", async () => {
    prisma.userPreference.findUnique.mockResolvedValue({
      city: "Cairo", minBudget: 1000, maxBudget: 5000,
    });
    prisma.userPreference.update.mockResolvedValue({ city: "Alex" });

    const result = await prefService.updatePreference("usr1", { city: "Alex" });
    expect(result.city).toBe("Alex");
  });

  it("throws 404 when preference not found", async () => {
    prisma.userPreference.findUnique.mockResolvedValue(null);
    await expect(prefService.updatePreference("usr1", {})).rejects.toThrow("Preference not found");
  });

  it("throws when minBudget > existing maxBudget", async () => {
    prisma.userPreference.findUnique.mockResolvedValue({
      minBudget: 1000, maxBudget: 3000,
    });
    await expect(
      prefService.updatePreference("usr1", { minBudget: 5000 }),
    ).rejects.toThrow("minBudget must be less than or equal to maxBudget");
  });

  it("throws when existing minBudget > new maxBudget", async () => {
    prisma.userPreference.findUnique.mockResolvedValue({
      minBudget: 3000, maxBudget: 5000,
    });
    await expect(
      prefService.updatePreference("usr1", { maxBudget: 2000 }),
    ).rejects.toThrow("minBudget must be less than or equal to maxBudget");
  });
});

describe("prefService.deletePreference", () => {
  it("deletes preference", async () => {
    prisma.userPreference.findUnique.mockResolvedValue({ id: "p1" });
    prisma.userPreference.delete.mockResolvedValue({ id: "p1" });

    const result = await prefService.deletePreference("usr1");
    expect(result.id).toBe("p1");
  });

  it("throws 404 when not found", async () => {
    prisma.userPreference.findUnique.mockResolvedValue(null);
    await expect(prefService.deletePreference("usr1")).rejects.toThrow("Preference not found");
  });
});

describe("prefService.getMatchingUnits", () => {
  it("returns matching units based on preferences", async () => {
    prisma.unit.findMany.mockResolvedValue([{ id: "u1", price: 2000 }]);

    const result = await prefService.getMatchingUnits({
      minBudget: 1000, maxBudget: 3000, city: "Cairo",
      rooms: 1, furnished: true, genderType: "MALE_ONLY",
      facilities: ["wifi"], university: "AUC", maxDistance: 10,
    });
    expect(result).toHaveLength(1);
  });

  it("works without university/distance", async () => {
    prisma.unit.findMany.mockResolvedValue([]);

    const result = await prefService.getMatchingUnits({
      minBudget: 1000, maxBudget: 3000, city: "Cairo",
      rooms: 1, furnished: true, genderType: "MALE_ONLY",
      facilities: [],
    });
    expect(result).toHaveLength(0);
  });
});
