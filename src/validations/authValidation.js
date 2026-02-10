import { z } from "zod";

// Password validation schema with strength requirements
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
  );

// Auth validation schemas
export const signUpSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: passwordSchema,
  phone: z.string().optional(),
  role: z.enum(["USER", "LANDLORD", "ADMIN"]).optional(),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const verifyResetCodeSchema = z.object({
  email: z.string().email("Invalid email address"),
  resetCode: z.string().length(6, "Reset code must be 6 digits"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  newPassword: passwordSchema,
});

export const googleLoginSchema = z.object({
  token: z.string().min(1, "Google token is required"),
});
