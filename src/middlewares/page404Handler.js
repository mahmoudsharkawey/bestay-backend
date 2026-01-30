import responseMessage from "../constants/responseMessage.js";
import httpError from "../utils/httpError.js";

const page404Handler = (req, _, next) => {
  try {
    throw new Error(responseMessage.NOT_FOUND("route"));
  } catch (error) {
    httpError(next, error, req, 404);
  }
};

export default page404Handler;
