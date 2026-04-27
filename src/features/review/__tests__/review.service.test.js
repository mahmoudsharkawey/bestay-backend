import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../prisma/client.js", () => ({
  default: {
    review: { findFirst: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), aggregate: vi.fn() },
    unit: { findUnique: vi.fn(), update: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));
vi.mock("../../../utils/softDelete.js", () => ({ softDelete: vi.fn() }));
vi.mock("../../../utils/AppError.js", () => ({
  default: class AppError extends Error {
    constructor(m, c) { super(m); this.statusCode = c; }
  },
}));

import prisma from "../../../prisma/client.js";
import { softDelete } from "../../../utils/softDelete.js";
import * as reviewService from "../review.service.js";

beforeEach(() => vi.clearAllMocks());

describe("reviewService.createReview", () => {
  it("creates a review successfully", async () => {
    prisma.review.findFirst.mockResolvedValue(null);
    prisma.unit.findUnique.mockResolvedValue({ id: "u1", deletedAt: null });
    prisma.user.findUnique.mockResolvedValue({ id: "usr1", deletedAt: null });
    prisma.review.create.mockResolvedValue({ id: "r1", rating: 5, user: { id: "usr1" } });
    prisma.review.aggregate.mockResolvedValue({ _avg: { rating: 5 } });
    prisma.unit.update.mockResolvedValue({});

    const result = await reviewService.createReview({
      userId: "usr1", unitId: "u1", rating: 5, comment: "Great",
    });
    expect(result.id).toBe("r1");
  });

  it("throws 409 when user already reviewed this unit", async () => {
    prisma.review.findFirst.mockResolvedValue({ id: "r1", deletedAt: null });
    await expect(
      reviewService.createReview({ userId: "usr1", unitId: "u1", rating: 5 }),
    ).rejects.toThrow("You have already reviewed this unit");
  });

  it("throws 404 when unit not found", async () => {
    prisma.review.findFirst.mockResolvedValue(null);
    prisma.unit.findUnique.mockResolvedValue(null);
    await expect(
      reviewService.createReview({ userId: "usr1", unitId: "bad", rating: 5 }),
    ).rejects.toThrow("Unit not found");
  });

  it("throws 400 for invalid rating", async () => {
    prisma.review.findFirst.mockResolvedValue(null);
    prisma.unit.findUnique.mockResolvedValue({ id: "u1", deletedAt: null });
    prisma.user.findUnique.mockResolvedValue({ id: "usr1", deletedAt: null });
    await expect(
      reviewService.createReview({ userId: "usr1", unitId: "u1", rating: 6 }),
    ).rejects.toThrow("Rating must be between 1 and 5");
  });
});

describe("reviewService.getReviewsByUnitId", () => {
  it("returns reviews for a unit", async () => {
    prisma.unit.findUnique.mockResolvedValue({ id: "u1" });
    prisma.review.findMany.mockResolvedValue([{ id: "r1" }]);

    const result = await reviewService.getReviewsByUnitId("u1");
    expect(result).toHaveLength(1);
  });

  it("throws 404 when unit not found", async () => {
    prisma.unit.findUnique.mockResolvedValue(null);
    await expect(reviewService.getReviewsByUnitId("bad")).rejects.toThrow("Unit not found");
  });
});

describe("reviewService.getReviewById", () => {
  it("returns a review", async () => {
    prisma.review.findUnique.mockResolvedValue({ id: "r1", deletedAt: null });
    const result = await reviewService.getReviewById("r1");
    expect(result.id).toBe("r1");
  });

  it("throws 404 when not found", async () => {
    prisma.review.findUnique.mockResolvedValue(null);
    await expect(reviewService.getReviewById("bad")).rejects.toThrow("Review not found");
  });
});

describe("reviewService.updateReviewById", () => {
  it("updates own review", async () => {
    prisma.review.findUnique.mockResolvedValue({ id: "r1", userId: "usr1", unitId: "u1", deletedAt: null });
    prisma.review.update.mockResolvedValue({ id: "r1", rating: 4 });
    prisma.review.aggregate.mockResolvedValue({ _avg: { rating: 4 } });
    prisma.unit.update.mockResolvedValue({});

    const result = await reviewService.updateReviewById("r1", "usr1", { rating: 4 });
    expect(result.rating).toBe(4);
  });

  it("throws 403 when not the owner", async () => {
    prisma.review.findUnique.mockResolvedValue({ id: "r1", userId: "other", deletedAt: null });
    await expect(
      reviewService.updateReviewById("r1", "usr1", { rating: 4 }),
    ).rejects.toThrow("You are not authorized to update this review");
  });
});

describe("reviewService.deleteReviewById", () => {
  it("deletes own review", async () => {
    prisma.review.findUnique.mockResolvedValue({ id: "r1", userId: "usr1", unitId: "u1", deletedAt: null });
    softDelete.mockResolvedValue({ id: "r1" });
    prisma.review.aggregate.mockResolvedValue({ _avg: { rating: 0 } });
    prisma.unit.update.mockResolvedValue({});

    const result = await reviewService.deleteReviewById("r1", "usr1");
    expect(softDelete).toHaveBeenCalled();
  });

  it("throws 403 when not the owner", async () => {
    prisma.review.findUnique.mockResolvedValue({ id: "r1", userId: "other", deletedAt: null });
    await expect(reviewService.deleteReviewById("r1", "usr1")).rejects.toThrow(
      "You are not authorized to delete this review",
    );
  });
});
