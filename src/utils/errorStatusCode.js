/**
 * Utility function to determine appropriate HTTP status code based on error message
 * @param {Error} error - The error object
 * @param {number} defaultCode - Default status code if no pattern matches (default: 500)
 * @returns {number} - Appropriate HTTP status code
 */
export const getErrorStatusCode = (error, defaultCode = 500) => {
  const message = error.message || "";

  // 400 - Bad Request (validation, expired, invalid status)
  if (
    message.includes("required") ||
    message.includes("expired") ||
    message.includes("Cannot create") ||
    message.includes("Cannot update") ||
    message.includes("not successful") ||
    message.includes("Invalid")
  ) {
    return 400;
  }

  // 401 - Unauthorized (authentication failures)
  if (message.includes("Invalid credentials")) {
    return 401;
  }

  // 403 - Forbidden (authorization failures)
  if (message.includes("Unauthorized")) {
    return 403;
  }

  // 404 - Not Found
  if (message.includes("not found")) {
    return 404;
  }

  // 409 - Conflict (duplicate, not available)
  if (message.includes("already exists") || message.includes("not available")) {
    return 409;
  }

  // Default to provided code or 500
  return defaultCode;
};
