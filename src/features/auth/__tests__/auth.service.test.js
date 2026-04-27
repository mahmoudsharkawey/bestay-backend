import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock Prisma ──────────────────────────────────────────
vi.mock("../../../prisma/client.js", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// ── Mock utilities ───────────────────────────────────────
vi.mock("../../../utils/password.js", () => ({
  hashPassword: vi.fn((p) => `hashed_${p}`),
  comparePassword: vi.fn(),
}));

vi.mock("../../../utils/jwt.js", () => ({
  signToken: vi.fn(() => "mock_jwt_token"),
}));

vi.mock("../../../utils/sendEmail.js", () => ({
  sendEmail: vi.fn(),
}));

vi.mock("../../../utils/verifyGoogleToken.js", () => ({
  verifyGoogleToken: vi.fn(),
}));

vi.mock("../../../utils/HTMLforEmails.js", () => ({
  ResetCodeHTML: vi.fn(() => "<html>reset</html>"),
}));

vi.mock("../../../utils/logger.js", () => ({
  default: { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}));

import prisma from "../../../prisma/client.js";
import { hashPassword, comparePassword } from "../../../utils/password.js";
import { sendEmail } from "../../../utils/sendEmail.js";
import { verifyGoogleToken } from "../../../utils/verifyGoogleToken.js";
import * as authService from "../auth.service.js";

beforeEach(() => vi.clearAllMocks());

// ─────────────────────────────────────────────────────────
// signUp
// ─────────────────────────────────────────────────────────
describe("authService.signUp", () => {
  it("creates a user when email is new", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: "1", name: "John", email: "john@test.com", role: "USER",
    });

    const user = await authService.signUp({
      name: "John", email: "john@test.com", password: "Pass1!", phone: null, role: "USER",
    });

    expect(user.id).toBe("1");
    expect(hashPassword).toHaveBeenCalledWith("Pass1!");
    expect(prisma.user.create).toHaveBeenCalled();
  });

  it("throws 409 when email already exists", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "1" });
    await expect(
      authService.signUp({ name: "X", email: "dup@test.com", password: "P" }),
    ).rejects.toThrow("User already exists with this email");
  });
});

// ─────────────────────────────────────────────────────────
// signIn
// ─────────────────────────────────────────────────────────
describe("authService.signIn", () => {
  it("returns user on valid credentials", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "1", email: "a@b.com", password: "hashed", deletedAt: null,
    });
    comparePassword.mockResolvedValue(true);

    const user = await authService.signIn({ email: "a@b.com", password: "pw" });
    expect(user.id).toBe("1");
  });

  it("throws on wrong password", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "1", email: "a@b.com", password: "hashed", deletedAt: null,
    });
    comparePassword.mockResolvedValue(false);

    await expect(
      authService.signIn({ email: "a@b.com", password: "wrong" }),
    ).rejects.toThrow("Invalid credentials");
  });

  it("throws when user not found", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      authService.signIn({ email: "x@b.com", password: "pw" }),
    ).rejects.toThrow("Invalid credentials");
  });

  it("throws when user is deleted", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "1", email: "a@b.com", deletedAt: new Date(),
    });
    await expect(
      authService.signIn({ email: "a@b.com", password: "pw" }),
    ).rejects.toThrow("Invalid credentials");
  });
});

// ─────────────────────────────────────────────────────────
// forgotPassword
// ─────────────────────────────────────────────────────────
describe("authService.forgotPassword", () => {
  it("sends a reset email when user exists", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "1", name: "John", deletedAt: null });
    prisma.user.update.mockResolvedValue({});

    await authService.forgotPassword("john@test.com");
    expect(sendEmail).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalled();
  });

  it("throws when user not found", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(authService.forgotPassword("nope@x.com")).rejects.toThrow(
      "No user found with this email",
    );
  });
});

// ─────────────────────────────────────────────────────────
// verifyResetCode
// ─────────────────────────────────────────────────────────
describe("authService.verifyResetCode", () => {
  it("verifies a valid code", async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: "1", passwordResetExpiry: new Date(Date.now() + 60000), passwordResetCode: "h",
    });
    comparePassword.mockResolvedValue(true);
    prisma.user.update.mockResolvedValue({});

    await authService.verifyResetCode("a@b.com", "123456");
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { passwordResetVerified: true } }),
    );
  });

  it("throws when code is expired", async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: "1", passwordResetExpiry: new Date(Date.now() - 60000),
    });
    await expect(authService.verifyResetCode("a@b.com", "123456")).rejects.toThrow(
      "Reset code has expired",
    );
  });

  it("throws on invalid code", async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: "1", passwordResetExpiry: new Date(Date.now() + 60000), passwordResetCode: "h",
    });
    comparePassword.mockResolvedValue(false);

    await expect(authService.verifyResetCode("a@b.com", "000000")).rejects.toThrow(
      "Invalid reset code",
    );
  });
});

// ─────────────────────────────────────────────────────────
// resetPassword
// ─────────────────────────────────────────────────────────
describe("authService.resetPassword", () => {
  it("resets password when code is verified", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "1", deletedAt: null, passwordResetVerified: true,
    });
    prisma.user.update.mockResolvedValue({});

    await authService.resetPassword("a@b.com", "NewPass1!");
    expect(hashPassword).toHaveBeenCalledWith("NewPass1!");
    expect(prisma.user.update).toHaveBeenCalled();
  });

  it("throws when code is not verified", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "1", deletedAt: null, passwordResetVerified: false,
    });
    await expect(authService.resetPassword("a@b.com", "x")).rejects.toThrow(
      "Reset code not verified",
    );
  });
});

// ─────────────────────────────────────────────────────────
// googleLogin
// ─────────────────────────────────────────────────────────
describe("authService.googleLogin", () => {
  it("creates a new user when not found", async () => {
    verifyGoogleToken.mockResolvedValue({
      email: "g@g.com", name: "Goo", sub: "abc", picture: "pic.jpg",
    });
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: "2", email: "g@g.com", name: "Goo", role: "USER", picture: "pic.jpg", phone: null, provider: "GOOGLE",
    });

    const result = await authService.googleLogin("google_token");
    expect(result.accessToken).toBeDefined();
    expect(result.user.email).toBe("g@g.com");
  });

  it("returns existing user", async () => {
    verifyGoogleToken.mockResolvedValue({
      email: "g@g.com", name: "Goo", sub: "abc", picture: "pic.jpg",
    });
    prisma.user.findUnique.mockResolvedValue({
      id: "3", email: "g@g.com", name: "Goo", role: "USER", picture: "pic.jpg", phone: null, provider: "GOOGLE",
    });

    const result = await authService.googleLogin("google_token");
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(result.user.id).toBe("3");
  });
});
