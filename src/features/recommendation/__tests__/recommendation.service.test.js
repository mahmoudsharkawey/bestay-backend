import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  calcPriceScore,
  calcLocationScore,
  calcFacilitiesScore,
  calcReviewsScore,
  calcPopularityScore,
  computeMatchScore,
} from "../recommendation.service.js";

// ─────────────────────────────────────────────────────────
// calcPriceScore
// ─────────────────────────────────────────────────────────

describe("calcPriceScore", () => {
  it("returns high score when price is at midpoint of budget", () => {
    const score = calcPriceScore(3000, 2000, 4000);
    expect(score).toBe(100);
  });

  it("returns slightly lower score at budget edges", () => {
    const scoreAtMin = calcPriceScore(2000, 2000, 4000);
    const scoreAtMax = calcPriceScore(4000, 2000, 4000);
    expect(scoreAtMin).toBeGreaterThanOrEqual(70);
    expect(scoreAtMax).toBeGreaterThanOrEqual(70);
    expect(scoreAtMin).toBeLessThan(100);
  });

  it("returns lower score when price is outside budget", () => {
    const score = calcPriceScore(6000, 2000, 4000);
    expect(score).toBeLessThan(70);
  });

  it("returns 0 for very far outlier prices", () => {
    const score = calcPriceScore(50000, 1000, 2000);
    expect(score).toBe(0);
  });

  it("returns 0 for zero or negative price", () => {
    expect(calcPriceScore(0, 1000, 2000)).toBe(0);
    expect(calcPriceScore(-100, 1000, 2000)).toBe(0);
  });

  it("handles equal min and max budget", () => {
    const score = calcPriceScore(5000, 5000, 5000);
    expect(score).toBe(100);
  });
});

// ─────────────────────────────────────────────────────────
// calcLocationScore
// ─────────────────────────────────────────────────────────

describe("calcLocationScore", () => {
  it("gives 50 pts for city match", () => {
    const score = calcLocationScore(
      { city: "Cairo" },
      { city: "Cairo" },
    );
    expect(score).toBe(50);
  });

  it("gives 0 for city mismatch", () => {
    const score = calcLocationScore(
      { city: "Alexandria" },
      { city: "Cairo" },
    );
    expect(score).toBe(0);
  });

  it("adds 30 pts for university match (+ 10 neutral distance)", () => {
    const score = calcLocationScore(
      { city: "Cairo", university: "AUC" },
      { city: "Cairo", university: "AUC" },
    );
    expect(score).toBe(90); // 50 city + 30 university + 10 neutral distance
  });

  it("adds distance score when distance is 0", () => {
    const score = calcLocationScore(
      { city: "Cairo", university: "AUC", distance: 0 },
      { city: "Cairo", university: "AUC", maxDistance: 10 },
    );
    expect(score).toBe(100); // 50 + 30 + 20
  });

  it("reduces distance score proportionally", () => {
    const score = calcLocationScore(
      { city: "Cairo", university: "AUC", distance: 5 },
      { city: "Cairo", university: "AUC", maxDistance: 10 },
    );
    // 50 + 30 + (1 - 0.5) * 20 = 90
    expect(score).toBe(90);
  });

  it("is case insensitive for city and university", () => {
    const score = calcLocationScore(
      { city: "cairo", university: "auc" },
      { city: "Cairo", university: "AUC" },
    );
    expect(score).toBe(90); // 50 + 30 + 10 neutral distance
  });
});

// ─────────────────────────────────────────────────────────
// calcFacilitiesScore
// ─────────────────────────────────────────────────────────

describe("calcFacilitiesScore", () => {
  it("returns 100 when all facilities match", () => {
    const score = calcFacilitiesScore(["wifi", "parking"], ["wifi", "parking"]);
    expect(score).toBe(100);
  });

  it("returns 50 when half of facilities match", () => {
    const score = calcFacilitiesScore(["wifi"], ["wifi", "parking"]);
    expect(score).toBe(50);
  });

  it("returns 0 when no facilities match", () => {
    const score = calcFacilitiesScore(["gym"], ["wifi", "parking"]);
    expect(score).toBe(0);
  });

  it("returns 100 when user requests no facilities", () => {
    const score = calcFacilitiesScore(["wifi"], []);
    expect(score).toBe(100);
  });

  it("returns 0 when unit has no facilities but user wants some", () => {
    const score = calcFacilitiesScore([], ["wifi"]);
    expect(score).toBe(0);
  });

  it("is case insensitive", () => {
    const score = calcFacilitiesScore(["WiFi", "PARKING"], ["wifi", "parking"]);
    expect(score).toBe(100);
  });
});

// ─────────────────────────────────────────────────────────
// calcReviewsScore
// ─────────────────────────────────────────────────────────

describe("calcReviewsScore", () => {
  it("returns 100 for rating of 5", () => {
    expect(calcReviewsScore(5)).toBe(100);
  });

  it("returns 60 for rating of 3", () => {
    expect(calcReviewsScore(3)).toBe(60);
  });

  it("returns 0 for rating of 0 or null", () => {
    expect(calcReviewsScore(0)).toBe(0);
    expect(calcReviewsScore(null)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────
// calcPopularityScore
// ─────────────────────────────────────────────────────────

describe("calcPopularityScore", () => {
  it("returns 0 when no favorites or bookings", () => {
    expect(calcPopularityScore(0, 0)).toBe(0);
  });

  it("returns a positive score for some favorites", () => {
    const score = calcPopularityScore(5, 3);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("caps at 100 for very popular units", () => {
    const score = calcPopularityScore(10000, 5000);
    expect(score).toBeLessThanOrEqual(100);
  });
});

// ─────────────────────────────────────────────────────────
// computeMatchScore
// ─────────────────────────────────────────────────────────

describe("computeMatchScore", () => {
  const mockPreference = {
    minBudget: 2000,
    maxBudget: 4000,
    city: "Cairo",
    university: "AUC",
    maxDistance: 10,
    rooms: 2,
    furnished: true,
    genderType: "MALE_ONLY",
    facilities: ["wifi", "parking"],
  };

  it("returns high score for a perfect match", () => {
    const unit = {
      price: 3000,
      city: "Cairo",
      university: "AUC",
      distance: 1,
      rooms: 2,
      furnished: true,
      genderType: "MALE_ONLY",
      facilities: ["wifi", "parking"],
      averageRating: 4.5,
      _count: { favorites: 10, bookings: 5 },
    };

    const { matchScore, breakdown } = computeMatchScore(unit, mockPreference);
    expect(matchScore).toBeGreaterThan(80);
    expect(breakdown).toHaveProperty("price");
    expect(breakdown).toHaveProperty("location");
    expect(breakdown).toHaveProperty("facilities");
    expect(breakdown).toHaveProperty("reviews");
    expect(breakdown).toHaveProperty("popularity");
  });

  it("returns lower score for a poor match", () => {
    const unit = {
      price: 10000,
      city: "Alexandria",
      university: null,
      distance: null,
      rooms: 1,
      furnished: false,
      genderType: "FEMALE_ONLY",
      facilities: [],
      averageRating: 1,
      _count: { favorites: 0, bookings: 0 },
    };

    const { matchScore } = computeMatchScore(unit, mockPreference);
    expect(matchScore).toBeLessThan(30);
  });

  it("sorts units by matchScore descending", () => {
    const unitA = {
      price: 3000, city: "Cairo", university: "AUC", distance: 1,
      facilities: ["wifi", "parking"], averageRating: 5,
      _count: { favorites: 10, bookings: 5 },
    };
    const unitB = {
      price: 8000, city: "Cairo", university: null, distance: null,
      facilities: [], averageRating: 2,
      _count: { favorites: 0, bookings: 0 },
    };

    const scoreA = computeMatchScore(unitA, mockPreference).matchScore;
    const scoreB = computeMatchScore(unitB, mockPreference).matchScore;
    expect(scoreA).toBeGreaterThan(scoreB);
  });
});
