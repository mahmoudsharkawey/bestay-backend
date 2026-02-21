import prisma from "../prisma/client.js";
import { signToken } from "../utils/jwt.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { sendEmail } from "../utils/sendEmail.js";
import { verifyGoogleToken } from "../utils/verifyGoogleToken.js";
import { ResetCodeHTML } from "../utils/HTMLforEmails.js";
import logger from "../utils/logger.js";

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

export const forgotPassword = async (email) => {
  //get user by email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("No user found with this email");

  // if user exists, generate a reset code and hash it
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code
  const hashedCode = await hashPassword(resetCode);

  // save the hashed code and its expiry in the database

  // add expiry time of 15 minutes

  await prisma.user.update({
    where: { email },
    data: {
      passwordResetCode: hashedCode,
      passwordResetExpiry: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
      passwordResetVerified: false,
    },
  });

  // send email with the reset code
  const htmlMessage = ResetCodeHTML(user, resetCode);

  await sendEmail(
    email,
    "🔐 Password Reset Code",
    `Hi ${user.name},\n\nYour password reset code is: ${resetCode}\n\nThis code will expire in 15 minutes.`,
    htmlMessage,
  );
  return user;
};

export const verifyResetCode = async (email, resetCode) => {
  const user = await prisma.user.findFirst({
    where: {
      email,
    },
  });

  logger.debug("Verifying reset code for user", { userId: user?.id, email });

  if (!user) {
    throw new Error(" No user found with this email");
  }

  if (user.passwordResetExpiry < new Date()) {
    throw new Error("Reset code has expired");
  }

  const match = await comparePassword(resetCode, user.passwordResetCode);
  if (!match) {
    throw new Error("Invalid reset code");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetVerified: true },
  });

  return user;
};

export const resetPassword = async (email, newPassword) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("No user found with this email");
  if (!user.passwordResetVerified) {
    throw new Error("Reset code not verified");
  }
  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { email },
    data: {
      password: hashed,
      passwordResetCode: null,
      passwordResetExpiry: null,
      passwordResetVerified: false,
    },
  });
  return user;
};

export const googleLogin = async (token) => {
  // 1. verify google token
  const { email, name, sub, picture } = await verifyGoogleToken(token);
  // 2. find or create user
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name,
        provider: "GOOGLE",
        providerId: sub,
        picture: picture,
      },
    });
  }

  // 3. generate JWT
  const accessToken = signToken({
    userId: user.id,
    role: user.role,
  });

  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
};
