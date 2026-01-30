import responseMessage from "../constants/responseMessage.js";

export default function httpError(nextFunc, err, req, errorStatusCode) {
  // Error structure
  const errorObject = {
    success: "false",
    statusCode: errorStatusCode,
    message:
      err instanceof Error ? err.message : responseMessage.SOMETHING_WENT_WRONG,
    request: { ip: req.ip || null, method: req.method, url: req.originalUrl },
    trace: err instanceof Error ? { error: err.stack } : null,
    timestamp: new Date().toISOString(),
  };
  // Log the response for debugging
  console.error("Controller Error:", { meta: errorObject });

  return nextFunc(errorObject);
}
