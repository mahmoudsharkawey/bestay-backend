import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";
import logger from "./logger.js";

let genAI = null;
let model = null;

// ── Cooldown: skip Gemini for a while after a quota / fatal error ──
let cooldownUntil = 0; // epoch-ms; 0 = no cooldown
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

const isOnCooldown = () => Date.now() < cooldownUntil;

const activateCooldown = () => {
  cooldownUntil = Date.now() + COOLDOWN_MS;
  logger.warn(
    `Gemini cooldown activated — skipping AI calls for ${COOLDOWN_MS / 1000}s`,
  );
};

/**
 * Lazily initialise the Gemini client.
 * Returns `null` when no API key is configured so callers can degrade gracefully.
 */
const getModel = () => {
  if (model) return model;

  if (!env.GEMINI_API_KEY) {
    logger.warn("GEMINI_API_KEY is not set – AI features will be disabled");
    return null;
  }

  genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  return model;
};

/**
 * Sleep helper for retry backoff.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Send a prompt to Gemini and receive a text response.
 * Includes retry with exponential backoff (max 2 retries).
 *
 * @param {string} prompt – The full prompt text
 * @returns {Promise<string|null>} The model's text reply, or `null` on failure
 */
export const generateContent = async (prompt) => {
  // Skip if on cooldown or no model
  if (isOnCooldown()) return null;

  const m = getModel();
  if (!m) return null;

  const MAX_RETRIES = 2;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await m.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      const is429 = error.message?.includes("429") || error.message?.includes("quota");
      const isRetryable = is429 || error.message?.includes("503");

      // Quota exhausted → cooldown (don't retry)
      if (is429) {
        logger.warn("Gemini quota exceeded — activating cooldown", {
          error: error.message,
        });
        activateCooldown();
        return null;
      }

      // Retryable server error → backoff and retry
      if (isRetryable && attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s
        logger.warn(`Gemini call failed (attempt ${attempt + 1}), retrying in ${delay}ms`);
        await sleep(delay);
        continue;
      }

      // Non-retryable or max retries exceeded
      logger.error("Gemini API call failed", {
        error: error.message,
      });
      return null;
    }
  }

  return null;
};

/**
 * Send a prompt and parse the response as JSON.
 * Falls back to `null` if parsing fails.
 *
 * @param {string} prompt – Must instruct the model to return valid JSON
 * @returns {Promise<Object|null>}
 */
export const generateJSON = async (prompt) => {
  try {
    const text = await generateContent(prompt);
    if (!text) return null;

    // Strip markdown code fences that Gemini sometimes wraps around JSON
    const cleaned = text
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (error) {
    logger.error("Failed to parse Gemini JSON response", {
      error: error.message,
    });
    return null;
  }
};
