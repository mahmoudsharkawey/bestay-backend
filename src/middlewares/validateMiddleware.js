import AppError from "../utils/AppError.js";

/**
 * Validation middleware factory
 * Creates middleware that validates request body against a Zod schema
 */
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        const errors = result.error.issues.map(
          (err) => `${err.path.join(".")}: ${err.message}`,
        );
        return next(
          new AppError(`Validation failed: ${errors.join(", ")}`, 400),
        );
      }

      // Replace req.body with validated and sanitized data
      req.body = result.data;
      next();
    } catch (error) {
      return next(
        new AppError(
          `Validation error: ${error.message || "Unknown error"}`,
          400,
        ),
      );
    }
  };
};

/**
 * Validation middleware factory for query parameters
 * Creates middleware that validates req.query against a Zod schema
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.query);

      if (!result.success) {
        const errors = result.error.issues.map(
          (err) => `${err.path.join(".")}: ${err.message}`,
        );
        return next(
          new AppError(`Query validation failed: ${errors.join(", ")}`, 400),
        );
      }

      // Replace req.query with validated and coerced data
      req.query = result.data;
      next();
    } catch (error) {
      return next(
        new AppError(
          `Query validation error: ${error.message || "Unknown error"}`,
          400,
        ),
      );
    }
  };
};

