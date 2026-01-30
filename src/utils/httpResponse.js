import logger from "./logger.js";

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
  // Avoid passing the original object to the logger because some loggers (e.g. winston) mutate
  // the object by adding internal fields like `level` or `timestamp`. Log a deep clone instead.
  const logCopy = JSON.parse(JSON.stringify(responseObject));
  logger.info(logCopy);
  // Send the response without logger-added fields
  res.status(responseStatusCode).json(responseObject);
}
