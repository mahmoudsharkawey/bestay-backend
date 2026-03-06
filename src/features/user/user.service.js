import prisma from "../../prisma/client.js";
import { comparePassword, hashPassword } from "../../utils/password.js";
import { softDelete } from "../../utils/softDelete.js";
import AppError from "../../utils/AppError.js";

// Fields safe to return to the client (never expose password, reset codes, etc.)
const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  picture: true,
  provider: true,
  createdAt: true,
};

// Fields a user is allowed to update on their own profile
const ALLOWED_UPDATE_FIELDS = ["name", "phone", "picture"];

// Get the authenticated user's profile
export const getProfile = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id, deletedAt: null },
    select: USER_SELECT,
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

// Update the authenticated user's profile (only whitelisted fields)
export const updateProfile = async (id, incomingData) => {
  // Verify user exists and is not deleted
  const existing = await prisma.user.findUnique({
    where: { id, deletedAt: null },
  });

  if (!existing) {
    throw new AppError("User not found", 404);
  }


  // Whitelist: only allow safe fields to be updated
  const data = {};
  for (const field of ALLOWED_UPDATE_FIELDS) {
    if (incomingData[field] !== undefined) {
      data[field] = incomingData[field];
    }
  }

  if (Object.keys(data).length === 0) {
    throw new AppError(
      `No valid fields to update. Allowed fields: ${ALLOWED_UPDATE_FIELDS.join(", ")}`,
      400,
    );
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: USER_SELECT,
  });

  return user;
};

// Soft-delete the authenticated user's account
export const deleteAccount = async (id, actorId) => {
  const user = await prisma.user.findUnique({
    where: { id, deletedAt: null },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const deletedUser = await softDelete(prisma.user, id, actorId);
  return deletedUser;
};

// Change user password
export const changePassword = async (id, oldPassword, newPassword) => {
  const user = await prisma.user.findUnique({
    where: { id, deletedAt: null },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!user.password) {
    throw new AppError(
      "Password change is not available for social login accounts",
      400,
    );
  }

  const oldMatch = await comparePassword(oldPassword, user.password);
  if (!oldMatch) {
    throw new AppError("Old password is incorrect", 401);
  }

  const newHashedPassword = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id },
    data: { password: newHashedPassword },
  });

  return { message: "Password changed successfully" };
};

// Get the authenticated user's preferences
export const getPreferences = async (userId) => {
  const preferences = await prisma.userPreference.findUnique({
    where: { userId },
  });

  if (!preferences) {
    throw new AppError("User preferences not found or not created yet", 404);
  }

  return preferences;
};

// Create or update the authenticated user's preferences
export const savePreferences = async (userId, prefs) => {
  const preferences = await prisma.userPreference.upsert({
    where: { userId },
    update: { ...prefs },
    create: { userId, ...prefs },
  });

  return preferences;
};
