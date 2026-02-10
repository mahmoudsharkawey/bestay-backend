/**
 * Validation middleware factory
 * Creates middleware that validates request body against a Zod schema
 */
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        const errors = result.error.errors.map(
          (err) => `${err.path.join(".")}: ${err.message}`,
        );
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: "Validation failed",
          errors: errors,
        });
      }

      // Replace req.body with validated and sanitized data
      req.body = result.data;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: "Validation error occurred",
      });
    }
  };
};
