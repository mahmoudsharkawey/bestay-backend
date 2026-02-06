import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import  httpError  from "../utils/httpError.js";

export const Authenticate = (req, res, next) => {
  const token = req.headers.authorization
  if (!token) return res.status(401).json({ message: "No token provided" });
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    httpError(next, error, req, 401);
  }
};
