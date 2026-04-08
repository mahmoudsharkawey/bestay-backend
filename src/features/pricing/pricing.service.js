import prisma from "../../prisma/client.js";
import { generateContent } from "../../utils/geminiClient.js";
import logger from "../../utils/logger.js";
import AppError from "../../utils/AppError.js";

// ─────────────────────────────────────────────────────────
// STATISTICAL HELPERS  (exported for testing)
// ─────────────────────────────────────────────────────────

/**
 * Calculate basic stats from an array of numbers.
 * @param {number[]} values – sorted ascending
 */
export const calcStats = (values) => {
  if (!values || values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  const sum = sorted.reduce((s, v) => s + v, 0);
  const avg = sum / n;

  // Median
  const mid = Math.floor(n / 2);
  const median = n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

  // Percentiles (nearest-rank method)
  const p25 = sorted[Math.max(0, Math.ceil(n * 0.25) - 1)];
  const p75 = sorted[Math.max(0, Math.ceil(n * 0.75) - 1)];

  return {
    count: n,
    average: Math.round(avg * 100) / 100,
    median: Math.round(median * 100) / 100,
    min: sorted[0],
    max: sorted[n - 1],
    percentile25: Math.round(p25 * 100) / 100,
    percentile75: Math.round(p75 * 100) / 100,
  };
};

/**
 * Determine where a price sits relative to the market.
 */
export const classifyPrice = (price, stats) => {
  if (!stats) return "UNKNOWN";

  if (price < stats.percentile25) return "BELOW_MARKET";
  if (price <= stats.percentile75) return "COMPETITIVE";
  if (price <= stats.max) return "ABOVE_MARKET";
  return "PREMIUM";
};

/**
 * Suggest a competitive price range.
 */
export const suggestRange = (stats) => {
  if (!stats) return null;
  return {
    min: Math.round(stats.percentile25),
    max: Math.round(stats.percentile75),
  };
};

// ─────────────────────────────────────────────────────────
// GEMINI INSIGHT
// ─────────────────────────────────────────────────────────

const buildPricingPrompt = (unitInfo, stats, position) => {
  return `You are an AI pricing advisor for a student housing platform called BeStay.

A landlord wants pricing advice for their unit:
${JSON.stringify(unitInfo, null, 2)}

Market analysis of ${stats.count} comparable units in the same area:
- Average price: ${stats.average}
- Median price: ${stats.median}
- Range: ${stats.min} – ${stats.max}
- 25th percentile: ${stats.percentile25}
- 75th percentile: ${stats.percentile75}
- Current price position: ${position}

Provide a brief, actionable pricing recommendation in 2-3 sentences.
Include specific tips on how to justify a higher price (e.g., adding facilities) or when to lower the price based on the market data.
Return ONLY the plain text recommendation, no JSON.`;
};

// ─────────────────────────────────────────────────────────
// MAIN SERVICE FUNCTIONS
// ─────────────────────────────────────────────────────────

/**
 * Get pricing suggestion for a set of input characteristics (not an existing unit).
 * Used by landlords exploring "what should I charge?" scenarios.
 */
export const getPricingSuggestion = async (input) => {
  const { city, rooms, roomType, genderType, furnished, facilities, price, university } = input;

  // 1. Find comparable units — tiered query, broadening until we find data
  const baseWhere = { status: "ACTIVE", deletedAt: null };

  // Tiers: most specific → least specific
  const tiers = [
    // Tier 1: same city, room type, gender, similar rooms
    { ...baseWhere, city, roomType, genderType, rooms: { gte: rooms - 1, lte: rooms + 1 } },
    // Tier 2: same city, room type only
    { ...baseWhere, city, roomType },
    // Tier 3: same city only
    { ...baseWhere, city },
    // Tier 4: all active units (last resort for market overview)
    baseWhere,
  ];

  const selectFields = {
    id: true, title: true, price: true, rooms: true,
    facilities: true, furnished: true, averageRating: true,
  };

  let comparables = [];
  let tierUsed = 0;

  for (let i = 0; i < tiers.length; i++) {
    comparables = await prisma.unit.findMany({
      where: tiers[i],
      select: selectFields,
      take: 200,
    });
    if (comparables.length > 0) {
      tierUsed = i + 1;
      break;
    }
  }

  if (comparables.length === 0) {
    return {
      unitSummary: { city, rooms, roomType, genderType, furnished, facilities, price, university },
      marketAnalysis: null,
      pricePosition: "NO_DATA",
      suggestedRange: null,
      aiInsight: "No units found on the platform yet. You're among the first — consider competitive introductory pricing.",
      comparableCount: 0,
    };
  }

  // 2. Calculate statistics
  const prices = comparables.map((u) => u.price);
  const stats = calcStats(prices);

  // 3. Position the input price (if provided)
  const position = price != null ? classifyPrice(price, stats) : "NOT_PROVIDED";
  const recommended = suggestRange(stats);

  // 4. Gemini insight
  const unitInfo = { city, rooms, roomType, genderType, furnished, facilities: facilities || [], price: price || "not set", university: university || "not specified" };
  let aiInsight = null;
  try {
    const prompt = buildPricingPrompt(unitInfo, stats, position);
    aiInsight = await generateContent(prompt);
  } catch (err) {
    logger.error("Gemini pricing insight failed", { error: err.message });
  }

  return {
    unitSummary: unitInfo,
    marketAnalysis: {
      comparableCount: stats.count,
      averagePrice: stats.average,
      medianPrice: stats.median,
      minPrice: stats.min,
      maxPrice: stats.max,
      percentile25: stats.percentile25,
      percentile75: stats.percentile75,
    },
    comparisonScope: ["", "exact", "room_type", "city", "platform"][tierUsed] || "unknown",
    pricePosition: position,
    suggestedRange: recommended,
    aiInsight,
  };
};

/**
 * Get pricing suggestion for an existing unit (by ID).
 * Only the unit's owner (LANDLORD) should call this.
 */
export const getPricingForUnit = async (unitId, userId) => {
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
  });

  if (!unit || unit.deletedAt) {
    throw new AppError("Unit not found", 404);
  }

  if (unit.ownerId !== userId) {
    throw new AppError("You can only get pricing suggestions for your own units", 403);
  }

  return getPricingSuggestion({
    city: unit.city,
    rooms: unit.rooms,
    roomType: unit.roomType,
    genderType: unit.genderType,
    furnished: unit.furnished,
    facilities: unit.facilities,
    price: unit.price,
    university: unit.university,
  });
};
