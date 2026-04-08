import httpError from "../../utils/httpError.js";
import httpResponse from "../../utils/httpResponse.js";
import * as pricingService from "./pricing.service.js";

/**
 * POST /api/v1/pricing/suggest
 * Get a pricing suggestion based on input characteristics.
 */
export const getPricingSuggestion = async (req, res, next) => {
  try {
    const result = await pricingService.getPricingSuggestion(req.body);

    httpResponse(
      req,
      res,
      200,
      "Pricing suggestion generated successfully",
      result,
    );
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};

/**
 * GET /api/v1/pricing/unit/:unitId
 * Get a pricing suggestion for an existing unit owned by the landlord.
 */
export const getPricingForUnit = async (req, res, next) => {
  try {
    const result = await pricingService.getPricingForUnit(
      req.params.unitId,
      req.user.id,
    );

    httpResponse(
      req,
      res,
      200,
      "Pricing suggestion for unit generated successfully",
      result,
    );
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};
