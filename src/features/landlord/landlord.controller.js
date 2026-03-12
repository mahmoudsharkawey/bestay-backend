import landlordService from "./landlord.service.js";
import httpError from "../../utils/httpError.js";
import httpResponse from "../../utils/httpResponse.js";

/**
 * Controller to retrieve landlord dashboard statistics
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const landlordId = req.user.id;
    const stats = await landlordService.getDashboardStats(landlordId);

    return httpResponse(
      req,
      res,
      200,
      "Landlord statistics fetched successfully",
      stats,
    );
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return httpError(next, error, req, statusCode);
  }
};

export default {
  getDashboardStats,
};
