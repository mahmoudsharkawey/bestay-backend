import responseMessage from "../constants/responseMessage.js";
import logger from "./logger.js";

export default function httpError(nextFunc, err, req, errorStatusCode) {
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
