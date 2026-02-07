import responseMessage from "../constants/responseMessage.js";
import logger from "./logger.js";

export default function httpError(nextFunc, err, req, errorStatusCode) {
  // Validate that nextFunc is provided and is a function
  if (!nextFunc || typeof nextFunc !== 'function') {
    console.error('🚨 CRITICAL ERROR: httpError called without valid "next" function!');
    console.error('This usually means the controller is missing the "next" parameter.');
    console.error('Controller signature should be: async (req, res, next) => {}');
    console.error('Current nextFunc:', nextFunc);
    console.error('Error:', err);

    // Throw a more descriptive error
    throw new Error(
      'httpError called without valid "next" function. ' +
      'Make sure your controller has (req, res, next) parameters.'
    );
  }

  // Error structure
  const errorObject = {
    success: "false",
    statusCode: Number.isInteger(errorStatusCode) ? errorStatusCode : 500,
    message:
      err instanceof Error ? err.message : responseMessage.SOMETHING_WENT_WRONG,
    request: { ip: req.ip || null, method: req.method, url: req.originalUrl },
    trace: err instanceof Error ? { error: err.stack } : null,
    timestamp: new Date().toISOString(),
  };

  // Avoid passing the original object to the logger because some loggers (e.g. winston) mutate
  // the object by adding internal fields like `level` or `timestamp`. Log a deep clone instead.
  const logCopy = JSON.parse(JSON.stringify(errorObject));
  logger.error(logCopy);

  return nextFunc(errorObject);
}
