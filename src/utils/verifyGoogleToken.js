import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";
import AppError from "./AppError.js";

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export async function verifyGoogleToken(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  console.log("Google token payload:", payload);

  if (!payload?.email) {
    throw new AppError("Invalid Google token", 400);
  }

  return {
    email: payload.email,
    name: payload.name,
    sub: payload.sub,
    picture: payload.picture,
  };
}
