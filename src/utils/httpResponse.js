export default function httpResponse(
  req,
  res,
  responseStatusCode,
  responseMessage,
  data = null,
) {
  // Response structure
  const response = {
    success: "true",
    statusCode: responseStatusCode,
    message: responseMessage,
    request: { ip: req.ip || null, method: req.method, url: req.originalUrl },
    data: data,
  };
  // Log the response for debugging
  console.info("Controller Response:", { meta: response });
  // Send the response
  res.status(responseStatusCode).json(response);
}
