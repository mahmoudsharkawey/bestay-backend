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
