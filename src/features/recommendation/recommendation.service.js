import prisma from "../../prisma/client.js";
import { generateJSON } from "../../utils/geminiClient.js";
import logger from "../../utils/logger.js";
import AppError from "../../utils/AppError.js";

// ─────────────────────────────────────────────────────────
// WEIGHT CONFIGURATION
// ─────────────────────────────────────────────────────────

const WEIGHTS = {
  price: 0.3,
  location: 0.25,
  facilities: 0.2,
  reviews: 0.15,
  popularity: 0.1,
};

// ─────────────────────────────────────────────────────────
// INDIVIDUAL SCORING FUNCTIONS  (exported for testing)
// ─────────────────────────────────────────────────────────

/**
 * Price score (0-100).
 * 100 = price exactly at midpoint of budget range.
 * Drops linearly as the price moves away.
 */
export const calcPriceScore = (price, minBudget, maxBudget) => {
  if (price <= 0 || maxBudget <= 0) return 0;

  // If price is within range → high score
  if (price >= minBudget && price <= maxBudget) {
    const midpoint = (minBudget + maxBudget) / 2;
    const halfRange = (maxBudget - minBudget) / 2 || 1;
    const distFromMid = Math.abs(price - midpoint);
    return Math.max(0, 100 - (distFromMid / halfRange) * 30); // at most 30 pts lost when at edges
  }

  // Outside range → penalise based on how far off
  const rangeSize = maxBudget - minBudget || 1;
  const overshoot =
    price < minBudget ? minBudget - price : price - maxBudget;
  return Math.max(0, 70 - (overshoot / rangeSize) * 100);
};

/**
 * Location score (0-100).
 * City match = 50 pts, university match = 30 pts, distance factor = 20 pts.
 */
export const calcLocationScore = (unit, preference) => {
  let score = 0;

  // City (must-match for candidates, but score it anyway for ranking)
  if (
    unit.city?.toLowerCase() === preference.city?.toLowerCase()
  ) {
    score += 50;
  }

  // University
  if (
    preference.university &&
    unit.university?.toLowerCase() === preference.university?.toLowerCase()
  ) {
    score += 30;
  }

  // Distance from university (lower is better)
  if (
    preference.maxDistance != null &&
    unit.distance != null
  ) {
    const distRatio = Math.min(unit.distance / preference.maxDistance, 1);
    score += (1 - distRatio) * 20; // 20 pts for 0 km, 0 pts at maxDistance
  } else if (unit.distance == null && preference.university) {
    // No distance data but user wants university proximity → neutral
    score += 10;
  }

  return Math.min(100, score);
};

/**
 * Facilities score (0-100).
 * Percentage of user's requested facilities present in the unit.
 */
export const calcFacilitiesScore = (unitFacilities, requestedFacilities) => {
  if (!requestedFacilities || requestedFacilities.length === 0) return 100;
  if (!unitFacilities || unitFacilities.length === 0) return 0;

  const unitSet = new Set(
    unitFacilities.map((f) => f.toLowerCase()),
  );
  const matched = requestedFacilities.filter((f) =>
    unitSet.has(f.toLowerCase()),
  );
  return (matched.length / requestedFacilities.length) * 100;
};

/**
 * Reviews score (0-100).
 * Normalises averageRating (0-5) to 0-100.
 */
export const calcReviewsScore = (averageRating) => {
  if (!averageRating || averageRating <= 0) return 0;
  return Math.min(100, (averageRating / 5) * 100);
};

/**
 * Popularity score (0-100).
 * Based on favourites + bookings count.
 */
export const calcPopularityScore = (favoritesCount, bookingsCount) => {
  const total = (favoritesCount || 0) + (bookingsCount || 0);
  // Logarithmic so it doesn't blow up for very popular units
  if (total === 0) return 0;
  return Math.min(100, Math.log2(total + 1) * 20);
};

// ─────────────────────────────────────────────────────────
// COMPOSITE SCORE
// ─────────────────────────────────────────────────────────

/**
 * Compute a weighted matchScore (0-100) for one unit.
 * @param {Object} unit      – unit row WITH _count and averageRating
 * @param {Object} preference – user preference row
 * @returns {{ matchScore: number, breakdown: Object }}
 */
export const computeMatchScore = (unit, preference) => {
  const priceScore = calcPriceScore(unit.price, preference.minBudget, preference.maxBudget);
  const locationScore = calcLocationScore(unit, preference);
  const facilitiesScore = calcFacilitiesScore(unit.facilities, preference.facilities);
  const reviewsScore = calcReviewsScore(unit.averageRating);
  const popularityScore = calcPopularityScore(
    unit._count?.favorites ?? 0,
    unit._count?.bookings ?? 0,
  );

  const matchScore =
    priceScore * WEIGHTS.price +
    locationScore * WEIGHTS.location +
    facilitiesScore * WEIGHTS.facilities +
    reviewsScore * WEIGHTS.reviews +
    popularityScore * WEIGHTS.popularity;

  return {
    matchScore: Math.round(matchScore * 10) / 10,
    breakdown: {
      price: Math.round(priceScore * 10) / 10,
      location: Math.round(locationScore * 10) / 10,
      facilities: Math.round(facilitiesScore * 10) / 10,
      reviews: Math.round(reviewsScore * 10) / 10,
      popularity: Math.round(popularityScore * 10) / 10,
    },
  };
};

// ─────────────────────────────────────────────────────────
// GEMINI ENHANCEMENT  (optional)
// ─────────────────────────────────────────────────────────

const buildAiPrompt = (preference, scoredUnits) => {
  const top = scoredUnits.slice(0, 10);
  return `You are an AI assistant for a student housing platform called BeStay.
A student is looking for accommodation with these preferences:
- Budget: ${preference.minBudget} – ${preference.maxBudget}
- City: ${preference.city}
- University: ${preference.university || "any"}
- Rooms: ${preference.rooms}
- Furnished: ${preference.furnished}
- Gender preference: ${preference.genderType}
- Desired facilities: ${preference.facilities?.join(", ") || "none specified"}

Here are the top ${top.length} matching units (JSON):
${JSON.stringify(
    top.map((u) => ({
      id: u.id,
      title: u.title,
      price: u.price,
      city: u.city,
      rooms: u.rooms,
      facilities: u.facilities,
      averageRating: u.averageRating,
      matchScore: u.matchScore,
    })),
    null,
    2,
  )}

For each unit, write a brief 1-2 sentence reason explaining WHY it is a good or less ideal match for this student.
Return ONLY a valid JSON array with objects { "id": "<unit id>", "reason": "<string>" }.`;
};

/**
 * Main recommendation service entry point.
 * @param {string} userId
 * @returns {Promise<{ recommendations: Object[], total: number }>}
 */
export const getSmartRecommendations = async (userId) => {
  // 1. Get user preferences
  const preference = await prisma.userPreference.findUnique({
    where: { userId },
  });

  if (!preference) {
    throw new AppError(
      "Please set your preferences first before getting recommendations",
      404,
    );
  }

  // 2. Fetch candidates with a broad filter — let the scoring algorithm rank them.
  //    Tiered: try city first, fall back to all active if city yields nothing.
  const baseWhere = { status: "ACTIVE", deletedAt: null };

  const includeBlock = {
    owner: {
      select: { id: true, name: true, picture: true },
    },
    _count: {
      select: { favorites: true, bookings: true, reviews: true },
    },
  };

  let candidates = await prisma.unit.findMany({
    where: { ...baseWhere, city: preference.city },
    include: includeBlock,
    take: 100,
    orderBy: { createdAt: "desc" },
  });

  // Fallback: if no units in the preferred city, widen to all active units
  if (candidates.length === 0) {
    candidates = await prisma.unit.findMany({
      where: baseWhere,
      include: includeBlock,
      take: 100,
      orderBy: { createdAt: "desc" },
    });
  }

  if (candidates.length === 0) {
    return { recommendations: [], total: 0 };
  }

  // 4. Score every candidate
  const scored = candidates
    .map((unit) => {
      const { matchScore, breakdown } = computeMatchScore(unit, preference);
      return { ...unit, matchScore, scoreBreakdown: breakdown, aiReason: null };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  // 5. Gemini enhancement (non-blocking — results still valid without it)
  try {
    const prompt = buildAiPrompt(preference, scored);
    const aiReasons = await generateJSON(prompt);

    if (Array.isArray(aiReasons)) {
      const reasonMap = new Map(aiReasons.map((r) => [r.id, r.reason]));
      for (const unit of scored) {
        unit.aiReason = reasonMap.get(unit.id) || null;
      }
    }
  } catch (err) {
    logger.warn("Gemini recommendation enhancement failed — using local reasons", {
      error: err.message,
    });
  }

  // 6. Fill in local reasons for any unit still missing an aiReason
  for (const unit of scored) {
    if (!unit.aiReason) {
      unit.aiReason = buildLocalReason(unit, preference);
    }
  }

  return {
    recommendations: scored,
    total: scored.length,
  };
};

// ─────────────────────────────────────────────────────────
// LOCAL FALLBACK REASON GENERATOR
// ─────────────────────────────────────────────────────────

/**
 * Generate a human-readable reason from the score breakdown
 * when Gemini is unavailable.
 */
function buildLocalReason(unit, preference) {
  const parts = [];
  const bd = unit.scoreBreakdown;

  // Price
  if (bd.price >= 90) {
    parts.push("Fits your budget perfectly");
  } else if (bd.price >= 70) {
    parts.push("Within your budget range");
  } else if (bd.price >= 40) {
    parts.push("Slightly outside your budget");
  } else {
    parts.push("Price is outside your preferred range");
  }

  // Location
  const sameCity = unit.city?.toLowerCase() === preference.city?.toLowerCase();
  if (sameCity && bd.location >= 80) {
    parts.push(`great location in ${unit.city}${unit.university ? ` near ${unit.university}` : ""}`);
  } else if (sameCity) {
    parts.push(`located in ${unit.city}`);
  } else {
    parts.push(`located in ${unit.city} (you preferred ${preference.city})`);
  }

  // Facilities
  if (bd.facilities >= 100) {
    parts.push("has all the facilities you want");
  } else if (bd.facilities >= 50) {
    parts.push("has most of the facilities you want");
  } else if (bd.facilities > 0) {
    parts.push("has some of the facilities you need");
  }

  // Reviews
  if (bd.reviews >= 80) {
    parts.push("highly rated by other tenants");
  } else if (bd.reviews >= 60) {
    parts.push("well reviewed");
  }

  // Combine
  const sentence = parts.join(", ") + ".";
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

