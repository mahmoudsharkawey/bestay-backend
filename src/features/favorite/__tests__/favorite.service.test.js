import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../prisma/client.js", () => ({
  default: {
    favorite: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn(), findMany: vi.fn() },
    unit: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));
vi.mock("../../../utils/AppError.js", () => ({
  default: class AppError extends Error {
    constructor(m, c) { super(m); this.statusCode = c; }
  },
}));

import prisma from "../../../prisma/client.js";
import * as favoriteService from "../favorite.service.js";

beforeEach(() => vi.clearAllMocks());

describe("favoriteService.addFavorite", () => {
  it("adds a favorite successfully", async () => {
    prisma.unit.findUnique.mockResolvedValue({ id: "u1", deletedAt: null });
    prisma.user.findUnique.mockResolvedValue({ id: "usr1" });
    prisma.favorite.findUnique.mockResolvedValue(null);
    prisma.favorite.create.mockResolvedValue({ id: "f1", userId: "usr1", unitId: "u1" });

    const result = await favoriteService.addFavorite({ userId: "usr1", unitId: "u1" });
    expect(result.id).toBe("f1");
  });

  it("throws 409 when already favorited", async () => {
    prisma.unit.findUnique.mockResolvedValue({ id: "u1", deletedAt: null });
    prisma.user.findUnique.mockResolvedValue({ id: "usr1" });
    prisma.favorite.findUnique.mockResolvedValue({ id: "f1" });

    await expect(
      favoriteService.addFavorite({ userId: "usr1", unitId: "u1" }),
    ).rejects.toThrow("Unit is already in favorites");
  });

  it("throws 404 when unit not found", async () => {
    prisma.unit.findUnique.mockResolvedValue(null);
    await expect(
      favoriteService.addFavorite({ userId: "usr1", unitId: "bad" }),
    ).rejects.toThrow("Unit not found");
  });

  it("throws 404 when user not found", async () => {
    prisma.unit.findUnique.mockResolvedValue({ id: "u1", deletedAt: null });
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      favoriteService.addFavorite({ userId: "bad", unitId: "u1" }),
    ).rejects.toThrow("User not found");
  });
});

describe("favoriteService.removeFavorite", () => {
  it("removes a favorite", async () => {
    prisma.favorite.findUnique.mockResolvedValue({ id: "f1" });
    prisma.favorite.delete.mockResolvedValue({ id: "f1" });

    const result = await favoriteService.removeFavorite("usr1", "u1");
    expect(result.id).toBe("f1");
  });

  it("throws 404 when not found", async () => {
    prisma.favorite.findUnique.mockResolvedValue(null);
    await expect(favoriteService.removeFavorite("usr1", "u1")).rejects.toThrow(
      "Favorite not found",
    );
  });
});

describe("favoriteService.getUserFavorites", () => {
  it("returns user favorites with stats", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "usr1" });
    prisma.favorite.findMany.mockResolvedValue([
      {
        id: "f1", userId: "usr1", unitId: "u1", createdAt: new Date(),
        unit: { id: "u1", reviews: [{ rating: 4 }, { rating: 5 }], owner: {} },
      },
    ]);

    const result = await favoriteService.getUserFavorites("usr1");
    expect(result).toHaveLength(1);
    expect(result[0].unit.averageRating).toBe(4.5);
  });

  it("throws 404 when user not found", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(favoriteService.getUserFavorites("bad")).rejects.toThrow("User not found");
  });
});

describe("favoriteService.checkIfFavorited", () => {
  it("returns true when favorited", async () => {
    prisma.favorite.findUnique.mockResolvedValue({ id: "f1" });
    const result = await favoriteService.checkIfFavorited("usr1", "u1");
    expect(result.isFavorited).toBe(true);
  });

  it("returns false when not favorited", async () => {
    prisma.favorite.findUnique.mockResolvedValue(null);
    const result = await favoriteService.checkIfFavorited("usr1", "u1");
    expect(result.isFavorited).toBe(false);
  });
});
