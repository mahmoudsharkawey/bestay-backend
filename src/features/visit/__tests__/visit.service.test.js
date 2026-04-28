import { describe, it, expect, vi, beforeEach } from "vitest";

// The visit service is heavily transactional and tightly coupled with prisma.$transaction,
// email sending, and notification creation. We test the key validation paths.

vi.mock("../../../prisma/client.js", () => ({
  default: {
    visit: { findFirst: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    unit: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
    booking: { findUnique: vi.fn(), create: vi.fn() },
    notification: { create: vi.fn() },
    $transaction: vi.fn((fn) => fn({
      visit: { create: vi.fn(), update: vi.fn(), findMany: vi.fn() },
      booking: { findUnique: vi.fn(() => null), create: vi.fn() },
      notification: { create: vi.fn() },
    })),
  },
}));
vi.mock("../../../utils/sendEmail.js", () => ({ sendEmail: vi.fn(() => Promise.resolve()) }));
vi.mock("../../../utils/logger.js", () => ({
  default: { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}));
vi.mock("../../../utils/dateValidation.js", () => ({
  validateFutureDate: vi.fn((d) => new Date(d)),
}));
vi.mock("../../../utils/HTMLforEmails.js", () => ({
  VisitRequestHTML: vi.fn(), VisitApprovedHTML: vi.fn(), VisitRejectedHTML: vi.fn(),
  RescheduleProposedHTML: vi.fn(), RescheduleAcceptedHTML: vi.fn(),
  RescheduleRejectedHTML: vi.fn(), VisitCancelledHTML: vi.fn(), VisitConfirmedHTML: vi.fn(),
}));
vi.mock("../../notification/notification.service.js", () => ({
  createNotification: vi.fn(),
}));
vi.mock("../../../utils/AppError.js", () => ({
  default: class AppError extends Error {
    constructor(m, c) { super(m); this.statusCode = c; }
  },
}));

import prisma from "../../../prisma/client.js";
import * as visitService from "../visit.service.js";

beforeEach(() => vi.clearAllMocks());

// ─────────────────────────────────────────────────────────
// createVisit
// ─────────────────────────────────────────────────────────
describe("visitService.createVisit", () => {
  const baseArgs = {
    userId: "usr1",
    unitId: "u1",
    proposedDate: new Date(Date.now() + 86400000).toISOString(),
  };

  it("throws 409 when user already has active visit for this unit", async () => {
    prisma.visit.findFirst.mockResolvedValue({ id: "v1", status: "PENDING_OWNER" });
    await expect(visitService.createVisit(baseArgs)).rejects.toThrow(
      "You already have an active visit request",
    );
  });

  it("throws 404 when unit not found", async () => {
    prisma.visit.findFirst.mockResolvedValue(null);
    prisma.unit.findUnique.mockResolvedValue(null);
    await expect(visitService.createVisit(baseArgs)).rejects.toThrow("not found");
  });

  it("throws when unit is not active", async () => {
    prisma.visit.findFirst.mockResolvedValue(null);
    prisma.unit.findUnique.mockResolvedValue({
      id: "u1", deletedAt: null, status: "DELETED", title: "X",
      owner: { id: "o1", name: "Owner", email: "o@o.com" },
    });
    await expect(visitService.createVisit(baseArgs)).rejects.toThrow(
      "is not available for visits",
    );
  });
});

// ─────────────────────────────────────────────────────────
// approveVisit
// ─────────────────────────────────────────────────────────
describe("visitService.approveVisit", () => {
  it("throws 404 when visit not found", async () => {
    prisma.visit.findUnique.mockResolvedValue(null);
    await expect(visitService.approveVisit("bad", "o1")).rejects.toThrow("not found");
  });

  it("throws 403 when not the owner", async () => {
    prisma.visit.findUnique.mockResolvedValue({
      id: "v1", status: "PENDING_OWNER",
      unit: { ownerId: "other", title: "X" },
      user: { id: "usr1", name: "U", email: "u@u.com" },
    });
    await expect(visitService.approveVisit("v1", "notowner")).rejects.toThrow(
      "not authorized to approve",
    );
  });

  it("throws when visit is not PENDING_OWNER", async () => {
    prisma.visit.findUnique.mockResolvedValue({
      id: "v1", status: "APPROVED",
      unit: { ownerId: "o1", title: "X" },
      user: { id: "usr1", name: "U", email: "u@u.com" },
    });
    await expect(visitService.approveVisit("v1", "o1")).rejects.toThrow(
      "Cannot approve visit with status APPROVED",
    );
  });
});

// ─────────────────────────────────────────────────────────
// rejectVisit
// ─────────────────────────────────────────────────────────
describe("visitService.rejectVisit", () => {
  it("throws 404 when visit not found", async () => {
    prisma.visit.findUnique.mockResolvedValue(null);
    await expect(visitService.rejectVisit("bad", "o1")).rejects.toThrow("not found");
  });

  it("throws 403 when not the owner", async () => {
    prisma.visit.findUnique.mockResolvedValue({
      id: "v1", status: "PENDING_OWNER",
      unit: { ownerId: "other", title: "X" },
      user: { id: "usr1", name: "U", email: "u@u.com" },
    });
    await expect(visitService.rejectVisit("v1", "notowner")).rejects.toThrow(
      "not authorized to reject",
    );
  });
});

// ─────────────────────────────────────────────────────────
// cancelVisit
// ─────────────────────────────────────────────────────────
describe("visitService.cancelVisit", () => {
  it("throws 404 when visit not found", async () => {
    prisma.visit.findUnique.mockResolvedValue(null);
    await expect(visitService.cancelVisit("bad", "usr1")).rejects.toThrow("not found");
  });

  it("throws 403 when not the visit owner", async () => {
    prisma.visit.findUnique.mockResolvedValue({
      id: "v1", status: "PENDING_OWNER",
      unit: { ownerId: "o1", title: "X", owner: { email: "o@o.com" } },
      user: { id: "other", name: "U", email: "u@u.com" },
    });
    await expect(visitService.cancelVisit("v1", "usr1")).rejects.toThrow(
      "not authorized to cancel",
    );
  });

  it("throws when visit is not cancellable", async () => {
    prisma.visit.findUnique.mockResolvedValue({
      id: "v1", status: "CONFIRMED",
      unit: { ownerId: "o1", title: "X", owner: { email: "o@o.com" } },
      user: { id: "usr1", name: "U", email: "u@u.com" },
    });
    await expect(visitService.cancelVisit("v1", "usr1")).rejects.toThrow(
      "Cannot cancel a visit with status CONFIRMED",
    );
  });
});

// ─────────────────────────────────────────────────────────
// getMyVisits
// ─────────────────────────────────────────────────────────
describe("visitService.getMyVisits", () => {
  it("returns visits for a USER (paginated)", async () => {
    prisma.visit.findMany.mockResolvedValue([{ id: "v1" }]);
    prisma.visit.count.mockResolvedValue(1);
    const result = await visitService.getMyVisits("usr1", "USER");
    expect(result.visits).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("returns visits for a LANDLORD (paginated)", async () => {
    prisma.visit.findMany.mockResolvedValue([{ id: "v2" }]);
    prisma.visit.count.mockResolvedValue(1);
    const result = await visitService.getMyVisits("o1", "LANDLORD");
    expect(result.visits).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────
// getVisitById
// ─────────────────────────────────────────────────────────
describe("visitService.getVisitById", () => {
  it("throws 404 when not found", async () => {
    prisma.visit.findUnique.mockResolvedValue(null);
    await expect(visitService.getVisitById("bad", "usr1", "USER")).rejects.toThrow(
      "not found",
    );
  });
});
