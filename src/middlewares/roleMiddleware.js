import AppError from "../utils/AppError.js";

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return next(new AppError("Forbidden: Insufficient role", 403));
    }
    next();
  };
};
