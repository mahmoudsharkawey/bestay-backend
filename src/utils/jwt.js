import jwt from "jsonwebtoken";
import { env } from "../config/env.js"

const JWT_SECRET = env.JWT_SECRET ;
const JWT_EXPIRES_IN = "1h";

export const signToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};
