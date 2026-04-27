import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../prisma/client.js", () => ({
  default: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    userPreference: { findUnique: vi.fn(), upsert: vi.fn() },
  },
}));
vi.mock("../../../utils/password.js", () => ({
  hashPassword: vi.fn((p) => `hashed_${p}`),
  comparePassword: vi.fn(),
}));
vi.mock("../../../utils/softDelete.js", () => ({
  softDelete: vi.fn(),
}));
vi.mock("../../../utils/AppError.js", () => {
  return {
    default: class AppError extends Error {
      constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
      }
    },
  };
});

import prisma from "../../../prisma/client.js";
import { comparePassword } from "../../../utils/password.js";
import { softDelete } from "../../../utils/softDelete.js";
import * as userService from "../user.service.js";

beforeEach(() => vi.clearAllMocks());

// ─────────────────────────────────────────────────────────
// getProfile
// ─────────────────────────────────────────────────────────
describe("userService.getProfile", () => {
  it("returns user profile when found", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "1", name: "John" });
    const user = await userService.getProfile("1");
    expect(user.name).toBe("John");
  });

  it("throws 404 when user not found", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(userService.getProfile("999")).rejects.toThrow("User not found");
  });
});

// ─────────────────────────────────────────────────────────
// updateProfile
// ─────────────────────────────────────────────────────────
describe("userService.updateProfile", () => {
  it("updates allowed fields", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "1", deletedAt: null });
    prisma.user.update.mockResolvedValue({ id: "1", name: "Jane" });

    const result = await userService.updateProfile("1", { name: "Jane" });
    expect(result.name).toBe("Jane");
  });

  it("throws when no valid fields provided", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "1", deletedAt: null });
    await expect(
      userService.updateProfile("1", { role: "ADMIN" }),
    ).rejects.toThrow("No valid fields to update");
  });

  it("throws when user not found", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      userService.updateProfile("999", { name: "X" }),
    ).rejects.toThrow("User not found");
  });
});

// ─────────────────────────────────────────────────────────
// deleteAccount
// ─────────────────────────────────────────────────────────
describe("userService.deleteAccount", () => {
  it("soft-deletes the user", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "1", deletedAt: null });
    softDelete.mockResolvedValue({ id: "1", deletedAt: new Date() });

    const result = await userService.deleteAccount("1", "1");
    expect(softDelete).toHaveBeenCalled();
    expect(result.deletedAt).toBeDefined();
  });

  it("throws when user not found", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(userService.deleteAccount("999", "999")).rejects.toThrow("User not found");
  });
});

// ─────────────────────────────────────────────────────────
// changePassword
// ─────────────────────────────────────────────────────────
describe("userService.changePassword", () => {
  it("changes password when old password is correct", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "1", password: "hashed_old", deletedAt: null });
    comparePassword.mockResolvedValue(true);
    prisma.user.update.mockResolvedValue({});

    const result = await userService.changePassword("1", "old", "new");
    expect(result.message).toBe("Password changed successfully");
  });

  it("throws when old password is wrong", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "1", password: "hashed_old", deletedAt: null });
    comparePassword.mockResolvedValue(false);

    await expect(
      userService.changePassword("1", "wrong", "new"),
    ).rejects.toThrow("Old password is incorrect");
  });

  it("throws for social login accounts", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "1", password: null, deletedAt: null });
    await expect(
      userService.changePassword("1", "old", "new"),
    ).rejects.toThrow("Password change is not available for social login accounts");
  });
});

// ─────────────────────────────────────────────────────────
// getPreferences
// ─────────────────────────────────────────────────────────
describe("userService.getPreferences", () => {
  it("returns preferences when found", async () => {
    prisma.userPreference.findUnique.mockResolvedValue({ city: "Cairo" });
    const prefs = await userService.getPreferences("1");
    expect(prefs.city).toBe("Cairo");
  });

  it("throws 404 when no preferences", async () => {
    prisma.userPreference.findUnique.mockResolvedValue(null);
    await expect(userService.getPreferences("1")).rejects.toThrow("User preferences not found");
  });
});

// ─────────────────────────────────────────────────────────
// savePreferences
// ─────────────────────────────────────────────────────────
describe("userService.savePreferences", () => {
  it("upserts preferences", async () => {
    prisma.userPreference.upsert.mockResolvedValue({ city: "Alex" });
    const result = await userService.savePreferences("1", { city: "Alex" });
    expect(result.city).toBe("Alex");
  });
});
