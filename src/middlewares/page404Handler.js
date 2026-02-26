import responseMessage from "../constants/responseMessage.js";
import httpError from "../utils/httpError.js";
import AppError from "../utils/AppError.js";

const page404Handler = (req, _, next) => {
  try {
    throw new AppError(responseMessage.NOT_FOUND("route"), 404);
  } catch (error) {
    httpError(next, error, req, 404);
  }
};

export default page404Handler;
