import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../prisma/client.js", () => ({
  default: {
    notification: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
  },
}));
vi.mock("../../../utils/AppError.js", () => ({
  default: class AppError extends Error {
    constructor(m, c) { super(m); this.statusCode = c; }
  },
}));

import prisma from "../../../prisma/client.js";
import * as notificationService from "../notification.service.js";

beforeEach(() => vi.clearAllMocks());

describe("notificationService.createNotification", () => {
  it("creates a notification", async () => {
    prisma.notification.create.mockResolvedValue({ id: "n1", message: "Hello" });
    const result = await notificationService.createNotification("usr1", "VISIT_APPROVED", "Hello");
    expect(result.id).toBe("n1");
  });
});

describe("notificationService.getMyNotifications", () => {
  it("returns user notifications", async () => {
    prisma.notification.findMany.mockResolvedValue([{ id: "n1" }, { id: "n2" }]);
    const result = await notificationService.getMyNotifications("usr1");
    expect(result).toHaveLength(2);
  });
});

describe("notificationService.markAsRead", () => {
  it("marks notification as read when owned", async () => {
    prisma.notification.findUnique.mockResolvedValue({ id: "n1", userId: "usr1" });
    prisma.notification.update.mockResolvedValue({ id: "n1", isRead: true });

    const result = await notificationService.markAsRead("n1", "usr1");
    expect(result.isRead).toBe(true);
  });

  it("throws 404 when not found", async () => {
    prisma.notification.findUnique.mockResolvedValue(null);
    await expect(notificationService.markAsRead("bad", "usr1")).rejects.toThrow(
      "Notification not found",
    );
  });

  it("throws 403 when not owned", async () => {
    prisma.notification.findUnique.mockResolvedValue({ id: "n1", userId: "other" });
    await expect(notificationService.markAsRead("n1", "usr1")).rejects.toThrow(
      "You are not authorized to update this notification",
    );
  });
});

describe("notificationService.markAllRead", () => {
  it("marks all as read", async () => {
    prisma.notification.updateMany.mockResolvedValue({ count: 5 });
    const result = await notificationService.markAllRead("usr1");
    expect(result.count).toBe(5);
  });
});

describe("notificationService.deleteNotification", () => {
  it("deletes notification when owned", async () => {
    prisma.notification.findUnique.mockResolvedValue({ id: "n1", userId: "usr1" });
    prisma.notification.delete.mockResolvedValue({ id: "n1" });

    const result = await notificationService.deleteNotification("n1", "usr1");
    expect(result.id).toBe("n1");
  });

  it("throws 404 when not found", async () => {
    prisma.notification.findUnique.mockResolvedValue(null);
    await expect(notificationService.deleteNotification("bad", "usr1")).rejects.toThrow(
      "Notification not found",
    );
  });

  it("throws 403 when not owned", async () => {
    prisma.notification.findUnique.mockResolvedValue({ id: "n1", userId: "other" });
    await expect(notificationService.deleteNotification("n1", "usr1")).rejects.toThrow(
      "You are not authorized to delete this notification",
    );
  });
});
