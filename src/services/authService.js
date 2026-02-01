import prisma from "../prisma/client.js";
import { hashPassword, comparePassword } from "../utils/password.js";

export const signUp = async ({ name, email, password, phone, role }) => {
  // check existing
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("User already exists with this email");

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, phone, role },
  });

  return user;
};

export const signIn = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) throw new Error("Invalid credentials");

  const match = await comparePassword(password, user.password);
  if (!match) throw new Error("Invalid credentials");

  return user;
};
