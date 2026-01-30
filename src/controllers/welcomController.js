import httpResponse from "../utils/httpResponse.js";
import ResponseMessage from "../constants/responseMessage.js";
import httpError from "../utils/httpError.js";

export const WelcomController = (req, res, next) => {
  try {
    httpResponse(req, res, 200, ResponseMessage.SUCCESS, {
      hello: "Welcome to our API!",
    });
  } catch (error) {
    httpError(next, error, req, 500);
  }
};
