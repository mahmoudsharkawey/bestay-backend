import prisma from "../prisma/client.js";
import { comparePassword, hashPassword } from "../utils/password.js";

//  Get user details by email
export const getUserDetails = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      phone: true,
      role: true,
      provider: true,
      providerId: true,
      picture: true,
    },
  });
  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

// update user details by email
export const updateUserDetails = async (id, userDetails) => {
  const user = await prisma.user.update({
    where: { id },
    data: { ...userDetails },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      phone: true,
      role: true,
      provider: true,
      providerId: true,
      picture: true,
    },
  });
  if (!user) {
    throw new Error("Failed to update user details");
  }
  return user;
};

// Delete user profile by id
export const deleteUser = async (id) => {
  const user = await prisma.user.delete({
    where: { id },
  });
  if (!user) {
    throw new Error("Failed to delete user profile");
  }
  return user;
};

// Change user password
export const changePassword = async (id, oldPassword, newPassword) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });
  if (!user) {
    throw new Error("User not found");
  }

  const oldMatch = await comparePassword(oldPassword, user.password);
  if (!oldMatch) {
    throw new Error("Old password is incorrect");
  }

  const newHashedPassword = await hashPassword(newPassword);
  const updatedUser = await prisma.user.update({
    where: { id },
    data: { password: newHashedPassword },
  });
  if (!updatedUser) {
    throw new Error("Failed to change password");
  }

  return updatedUser;
};

//  Get user preferences
export const getUserPreference = async (userId) => {
  const preferences = await prisma.userPreference.findUnique({
    where: { userId },
  });
  if (!preferences) {
    throw new Error("User preferences not found");
  }
  return preferences;
};

// create or update user preferences
export const upsertUserPreference = async (userId, prefs) => {
  const preferences = await prisma.userPreference.upsert({
    where: { userId },
    update: { ...prefs },
    create: { userId, ...prefs },
  });
  if (!preferences) {
    throw new Error("Failed to upsert user preferences");
  }
  return preferences;
};
