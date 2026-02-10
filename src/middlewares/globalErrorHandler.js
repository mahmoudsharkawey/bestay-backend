const ErrorHandler = (err, req, res, next) => {
  // Default status code to 500 if not provided or invalid
  const statusCode =
    err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;

  // Log error details to console for easier debugging
  console.error("❌ Error Handler Triggered:");
  console.error("Status Code:", statusCode);
  console.error("Error Message:", err.message || "No message provided");
  console.error("Error Object:", err);

  // In development, log the full stack trace
  if (process.env.NODE_ENV === "development" && err.stack) {
    console.error("Stack Trace:", err.stack);
  }

  // Prepare error response
  const errorResponse = {
    success: false,
    statusCode: statusCode,
    // In production, use generic message for 500 errors to avoid leaking implementation details
    message:
      process.env.NODE_ENV === "production" && statusCode === 500
        ? "An unexpected error occurred"
        : err.message || "An unexpected error occurred",
    // Only include stack trace and debug info in development
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      trace: err.trace,
      request: err.request,
    }),
  };

  res.status(statusCode).json(errorResponse);
};

export default ErrorHandler;
