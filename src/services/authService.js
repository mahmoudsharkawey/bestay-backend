import prisma from "../prisma/client.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { sendEmail } from "../utils/sendEmail.js";

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
  const htmlMessage = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px;">BeStay</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
      </div>
      <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px;">
        <p style="color: #333; font-size: 16px;">Hi <strong>${user.name}</strong>,</p>
        <p style="color: #666; line-height: 1.6;">We received a request to reset your password. Use the code below to complete the process:</p>
        <div style="background-color: #f0f0f0; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
          <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Your Reset Code:</p>
          <p style="font-size: 32px; font-weight: bold; color: #667eea; margin: 0; letter-spacing: 2px;">${resetCode}</p>
        </div>
        <p style="color: #999; font-size: 14px; margin: 20px 0;">⏱️ This code will expire in <strong>15 minutes</strong></p>
        <p style="color: #666; line-height: 1.6;">If you didn't request a password reset, please ignore this email or contact our support team.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; margin: 0;">Best regards,<br><strong>BeStay Team</strong></p>
      </div>
    </div>
  `;

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

  console.log("Verifying reset code for user:", user);

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
