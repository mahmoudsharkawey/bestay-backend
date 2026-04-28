import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../prisma/client.js", () => ({
  default: {
    visit: { findUnique: vi.fn(), update: vi.fn() },
    payment: { findUnique: vi.fn(), upsert: vi.fn(), findMany: vi.fn(), update: vi.fn(), count: vi.fn() },
    notification: { create: vi.fn() },
    $transaction: vi.fn((arr) => Promise.resolve(arr.map(() => ({})))),
  },
}));
vi.mock("../../../config/env.js", () => ({
  env: {
    STRIPE_SECRET_KEY: "sk_test_fake",
    STRIPE_WEBHOOK_SECRET: "whsec_fake",
    DEPOSIT_PERCENTAGE: 50,
  },
}));
vi.mock("../../../utils/paymentIntent.js", () => ({
  createPaymentIntentUtil: vi.fn(() => ({ id: "pi_123", client_secret: "cs_123" })),
  refundPaymentUtil: vi.fn(),
}));
vi.mock("../../../utils/sendEmail.js", () => ({ sendEmail: vi.fn(() => Promise.resolve()) }));
vi.mock("../../../utils/HTMLforEmails.js", () => ({
  PaymentSuccessHTML: vi.fn(), PaymentRefundedHTML: vi.fn(),
}));
vi.mock("../../notification/notification.service.js", () => ({
  createNotification: vi.fn(),
}));
vi.mock("../../../utils/AppError.js", () => ({
  default: class AppError extends Error {
    constructor(m, c) { super(m); this.statusCode = c; }
  },
}));
// Mock Stripe constructor — must support `new Stripe(...)` call
vi.mock("stripe", () => {
  function StripeMock() {
    this.paymentIntents = { retrieve: vi.fn() };
    this.webhooks = { constructEvent: vi.fn() };
  }
  return { default: StripeMock };
});

import prisma from "../../../prisma/client.js";
import * as paymentService from "../payment.service.js";

beforeEach(() => vi.clearAllMocks());

describe("paymentService.createPaymentIntent", () => {
  it("throws 404 when visit not found", async () => {
    prisma.visit.findUnique.mockResolvedValue(null);
    await expect(paymentService.createPaymentIntent("bad", "usr1")).rejects.toThrow(
      "Visit not found",
    );
  });

  it("throws 403 when visit doesn't belong to user", async () => {
    prisma.visit.findUnique.mockResolvedValue({
      id: "v1", userId: "other", status: "APPROVED", unit: { price: 1000 },
    });
    await expect(paymentService.createPaymentIntent("v1", "usr1")).rejects.toThrow(
      "does not belong to you",
    );
  });

  it("throws 400 when visit is not APPROVED", async () => {
    prisma.visit.findUnique.mockResolvedValue({
      id: "v1", userId: "usr1", status: "PENDING_OWNER", unit: { price: 1000 },
    });
    await expect(paymentService.createPaymentIntent("v1", "usr1")).rejects.toThrow(
      "Payment can only be initiated for APPROVED visits",
    );
  });

  it("throws 409 when already paid", async () => {
    prisma.visit.findUnique.mockResolvedValue({
      id: "v1", userId: "usr1", status: "APPROVED", unit: { price: 1000 },
    });
    prisma.payment.findUnique.mockResolvedValue({ status: "PAID" });

    await expect(paymentService.createPaymentIntent("v1", "usr1")).rejects.toThrow(
      "already been paid",
    );
  });
});

describe("paymentService.refundPayment", () => {
  it("throws 404 when payment not found", async () => {
    prisma.payment.findUnique.mockResolvedValue(null);
    await expect(paymentService.refundPayment("bad")).rejects.toThrow("Payment not found");
  });

  it("throws 400 when payment is not refundable", async () => {
    prisma.payment.findUnique.mockResolvedValue({
      id: "p1", status: "PENDING",
      user: { id: "u1", email: "u@u.com" },
      visit: { id: "v1" },
    });
    await expect(paymentService.refundPayment("p1")).rejects.toThrow(
      "Cannot refund a payment with status PENDING",
    );
  });
});

describe("paymentService.getMyPayments", () => {
  it("returns user payments for USER role (paginated)", async () => {
    prisma.payment.findMany.mockResolvedValue([{ id: "p1" }]);
    prisma.payment.count.mockResolvedValue(1);
    const result = await paymentService.getMyPayments("usr1", "USER");
    expect(result.payments).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("returns unit payments for LANDLORD role (paginated)", async () => {
    prisma.payment.findMany.mockResolvedValue([{ id: "p2" }]);
    prisma.payment.count.mockResolvedValue(1);
    const result = await paymentService.getMyPayments("o1", "LANDLORD");
    expect(result.payments).toHaveLength(1);
  });
});

describe("paymentService.getAllPayments", () => {
  it("returns paginated payments", async () => {
    prisma.payment.findMany.mockResolvedValue([{ id: "p1" }]);
    prisma.payment.count.mockResolvedValue(1);

    const result = await paymentService.getAllPayments(1, 10);
    expect(result.payments).toHaveLength(1);
    expect(result.total).toBe(1);
  });
});
