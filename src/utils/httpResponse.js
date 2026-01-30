import logger from "./logger.js"

export default function httpResponse(
  req,
  res,
  responseStatusCode,
  responseMessage,
  data = null,
) {
  // Response structure
  const responseObject = {
    success: "true",
    statusCode: responseStatusCode,
    message: responseMessage,
    request: { ip: req.ip || null, method: req.method, url: req.originalUrl },
    data: data,
  };
  // Log the response for debugging
 // logger.info(responseObject);
 logger.info(responseObject)
  // Send the response
  res.status(responseStatusCode).json(responseObject);
}
