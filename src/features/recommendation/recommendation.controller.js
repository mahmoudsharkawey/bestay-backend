import httpError from "../../utils/httpError.js";
import httpResponse from "../../utils/httpResponse.js";
import { getSmartRecommendations } from "./recommendation.service.js";

/**
 * GET /api/v1/recommendations
 * Returns AI-scored unit recommendations for the authenticated user.
 */
export const getRecommendations = async (req, res, next) => {
  try {
    const { recommendations, total } = await getSmartRecommendations(
      req.user.id,
    );

    httpResponse(
      req,
      res,
      200,
      "Recommendations retrieved successfully",
      { recommendations, total },
    );
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};
