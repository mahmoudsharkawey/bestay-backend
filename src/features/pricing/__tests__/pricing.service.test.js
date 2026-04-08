import { describe, it, expect } from "vitest";
import {
  calcStats,
  classifyPrice,
  suggestRange,
} from "../pricing.service.js";

// ─────────────────────────────────────────────────────────
// calcStats
// ─────────────────────────────────────────────────────────

describe("calcStats", () => {
  it("calculates correct stats for a sorted array", () => {
    const prices = [1000, 2000, 3000, 4000, 5000];
    const stats = calcStats(prices);

    expect(stats.count).toBe(5);
    expect(stats.average).toBe(3000);
    expect(stats.median).toBe(3000);
    expect(stats.min).toBe(1000);
    expect(stats.max).toBe(5000);
    expect(stats.percentile25).toBe(2000);
    expect(stats.percentile75).toBe(4000);
  });

  it("calculates correct median for even-length array", () => {
    const prices = [1000, 2000, 3000, 4000];
    const stats = calcStats(prices);

    expect(stats.median).toBe(2500); // (2000 + 3000) / 2
    expect(stats.count).toBe(4);
  });

  it("handles single-element array", () => {
    const stats = calcStats([5000]);

    expect(stats.count).toBe(1);
    expect(stats.average).toBe(5000);
    expect(stats.median).toBe(5000);
    expect(stats.min).toBe(5000);
    expect(stats.max).toBe(5000);
    expect(stats.percentile25).toBe(5000);
    expect(stats.percentile75).toBe(5000);
  });

  it("handles unsorted input correctly", () => {
    const prices = [5000, 1000, 3000, 2000, 4000];
    const stats = calcStats(prices);

    expect(stats.min).toBe(1000);
    expect(stats.max).toBe(5000);
    expect(stats.median).toBe(3000);
  });

  it("returns null for empty array", () => {
    expect(calcStats([])).toBeNull();
  });

  it("returns null for null/undefined", () => {
    expect(calcStats(null)).toBeNull();
    expect(calcStats(undefined)).toBeNull();
  });

  it("rounds to 2 decimal places", () => {
    const prices = [1000, 2000, 3333];
    const stats = calcStats(prices);

    expect(stats.average).toBe(2111);
    // average = 6333 / 3 = 2111.0
  });
});

// ─────────────────────────────────────────────────────────
// classifyPrice
// ─────────────────────────────────────────────────────────

describe("classifyPrice", () => {
  const stats = {
    count: 10,
    average: 3000,
    median: 3000,
    min: 1000,
    max: 5000,
    percentile25: 2000,
    percentile75: 4000,
  };

  it("returns BELOW_MARKET for price below 25th percentile", () => {
    expect(classifyPrice(1500, stats)).toBe("BELOW_MARKET");
  });

  it("returns COMPETITIVE for price within 25th-75th percentile", () => {
    expect(classifyPrice(3000, stats)).toBe("COMPETITIVE");
    expect(classifyPrice(2000, stats)).toBe("COMPETITIVE");
    expect(classifyPrice(4000, stats)).toBe("COMPETITIVE");
  });

  it("returns ABOVE_MARKET for price between 75th percentile and max", () => {
    expect(classifyPrice(4500, stats)).toBe("ABOVE_MARKET");
  });

  it("returns PREMIUM for price above max", () => {
    expect(classifyPrice(6000, stats)).toBe("PREMIUM");
  });

  it("returns UNKNOWN when stats is null", () => {
    expect(classifyPrice(3000, null)).toBe("UNKNOWN");
  });

  it("returns BELOW_MARKET for price at exact min", () => {
    expect(classifyPrice(1000, stats)).toBe("BELOW_MARKET");
  });

  it("returns ABOVE_MARKET for price at exact max", () => {
    expect(classifyPrice(5000, stats)).toBe("ABOVE_MARKET");
  });
});

// ─────────────────────────────────────────────────────────
// suggestRange
// ─────────────────────────────────────────────────────────

describe("suggestRange", () => {
  it("returns min/max based on percentiles", () => {
    const stats = {
      percentile25: 2500,
      percentile75: 4500,
    };

    const range = suggestRange(stats);
    expect(range.min).toBe(2500);
    expect(range.max).toBe(4500);
  });

  it("rounds the values", () => {
    const stats = {
      percentile25: 2333.33,
      percentile75: 4666.67,
    };

    const range = suggestRange(stats);
    expect(range.min).toBe(2333);
    expect(range.max).toBe(4667);
  });

  it("returns null when stats is null", () => {
    expect(suggestRange(null)).toBeNull();
  });
});
