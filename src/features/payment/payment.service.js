import prisma from "../../prisma/client.js";
import Stripe from "stripe";
import { env } from "../../config/env.js";
import {
  createPaymentIntentUtil,
  refundPaymentUtil,
} from "../../utils/paymentIntent.js";
import { sendEmail } from "../../utils/sendEmail.js";
import {
  PaymentSuccessHTML,
  PaymentRefundedHTML,
} from "../../utils/HTMLforEmails.js";

/**
 * Create a Stripe payment intent for an approved visit.
 *
 * Flow:
 *  1. Fetch the visit (must exist and be APPROVED).
 *  2. Fetch the unit price to know how much to charge.
 *  3. Call Stripe to create a PaymentIntent.
 *  4. Upsert a Payment record with status PENDING and the stripeIntentId.
 *  5. Return the clientSecret to the client.
 *
 * @param {string} visitId  - The UUID of the visit
 * @param {string} userId   - The authenticated user's UUID
 * @returns {{ clientSecret: string, paymentId: string }}
 */
export async function createPaymentIntent(visitId, userId) {
  // 1. Load the visit along with its unit (for pricing)
  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
    include: { unit: true },
  });

  if (!visit) {
    const err = new Error("Visit not found");
    err.statusCode = 404;
    throw err;
  }

  // 2. Only the user who owns the visit may pay
  if (visit.userId !== userId) {
    const err = new Error("Forbidden: this visit does not belong to you");
    err.statusCode = 403;
    throw err;
  }

  // 3. Visit must be APPROVED before a payment can be created
  if (visit.status !== "APPROVED") {
    const err = new Error(
      `Payment can only be initiated for APPROVED visits. Current status: ${visit.status}`,
    );
    err.statusCode = 400;
    throw err;
  }

  // 4. Prevent duplicate payments (idempotency guard)
  const existingPayment = await prisma.payment.findUnique({
    where: { visitId },
  });

  if (existingPayment && existingPayment.status === "PAID") {
    const err = new Error("This visit has already been paid");
    err.statusCode = 409;
    throw err;
  }

  // 5. Create the Stripe PaymentIntent (amount is in EGP; util converts to piastres)
  const depositPercentage = env.DEPOSIT_PERCENTAGE / 100;
  const unitPrice = visit.unit.price * depositPercentage;
  const stripeIntent = await createPaymentIntentUtil(unitPrice, visitId);

  // 6. Upsert the Payment record (create on first call, update on retry)
  const payment = await prisma.payment.upsert({
    where: { visitId },
    create: {
      userId,
      visitId,
      amount: Math.round(unitPrice * 100), // stored in piastres (Int)
      status: "PENDING",
      stripeIntentId: stripeIntent.id,
    },
    update: {
      // On retry: refresh the stripe intent id (new intent was created)
      stripeIntentId: stripeIntent.id,
      status: "PENDING",
    },
  });

  return {
    clientSecret: stripeIntent.client_secret,
    paymentId: payment.id,
  };
}

// Stripe client (shared instance)
const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-11-17.clover",
});

/**
 * Handle an incoming Stripe webhook event.
 *
 * MUST receive the raw Buffer body so Stripe can verify the signature.
 *
 * Handles:
 *   - payment_intent.succeeded → Payment.status = PAID, Visit.paymentPaid = true
 *
 * @param {Buffer} rawBody  - Raw request body (express.raw output)
 * @param {string} sig      - Value of the stripe-signature header
 */
export async function handleStripeWebhook(rawBody, sig) {
  // 1. Verify signature — throws if invalid/tampered
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    const error = new Error(
      `Webhook signature verification failed: ${err.message}`,
    );
    error.statusCode = 400;
    throw error;
  }

  // 2. Dispatch on event type
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const visitId = paymentIntent.metadata?.visitId;

    if (!visitId) {
      // No visitId in metadata — nothing to update, acknowledge silently
      return { received: true };
    }

    // 3. Atomically mark Payment PAID and Visit.paymentPaid = true
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      include: { payment: true, user: true },
    });
    if (!visit) {
      const err = new Error("Visit not found");
      err.statusCode = 404;
      throw err;
    }
    await prisma.$transaction([
      prisma.payment.update({
        where: { visitId },
        data: { status: "PAID" },
      }),
      prisma.visit.update({
        where: { id: visitId },
        data: { paymentPaid: true, paymentId: visit.payment.id },
      }),
      prisma.notification.create({
        data: {
          userId: visit.user.id,
          type: "PAYMENT_CONFIRMED",
          message: "Your payment has been processed successfully",
        },
      }),
    ]);

    // send notification email to the user
    await sendEmail(
      visit.user.email,
      "Payment Successful 💳",
      `Your payment has been processed successfully. Visit ID: ${visitId}`,
      PaymentSuccessHTML(visit.user, visitId),
    );
  }

  return { received: true };
}

/**
 * Refund a payment (admin-only).
 *
 * Flow:
 *  1. Fetch the Payment record by its own ID.
 *  2. Validate it is in a refundable state (PAID or PENDING_REFUND).
 *  3. Issue the refund on Stripe.
 *  4. Mark Payment.status = REFUNDED and set refundedAt in a transaction.
 *
 * @param {string} paymentId - The UUID of the Payment record
 * @returns {Payment} The updated payment record
 */
export async function refundPayment(paymentId) {
  // 1. Load the payment
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      user: { select: { id: true, email: true } },
      visit: { select: { id: true } },
    },
  });

  if (!payment) {
    const err = new Error("Payment not found");
    err.statusCode = 404;
    throw err;
  }

  // 2. Only PAID payments can be refunded
  if (payment.status !== "PAID" && payment.status !== "PENDING_REFUND") {
    const err = new Error(
      `Cannot refund a payment with status ${payment.status}. Only PAID payments are refundable.`,
    );
    err.statusCode = 400;
    throw err;
  }

  if (!payment.stripeIntentId) {
    const err = new Error("No Stripe PaymentIntent linked to this payment");
    err.statusCode = 400;
    throw err;
  }

  // 3. Issue the refund on Stripe (via shared util)
  await refundPaymentUtil(payment.stripeIntentId);

  // 4. Atomically update Payment record
  const updated = await prisma.$transaction([
    prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "REFUNDED",
        refundedAt: new Date(),
      },
    }),
    prisma.notification.create({
      data: {
        userId: payment.user.id,
        type: "PAYMENT_REFUNDED",
        message: "Your payment refund has been processed successfully",
      },
    }),
    prisma.visit.update({
      where: { id: payment.visitId },
      data: { status: "REFUNDED" },
    }),
  ]);

  // 5. Notify the user by email (non-blocking)
  sendEmail(
    payment.user.email,
    "Payment Refunded ↩️",
    `Your payment (ID: ${paymentId}) has been refunded successfully.`,
    PaymentRefundedHTML(payment.user, paymentId),
  ).catch(() => {}); // fire-and-forget

  return updated[0]; // the updated Payment record
}

// ─── READ: Get all payments for the authenticated user or landlord ───
export async function getMyPayments(userId, role) {
  const where =
    role === "LANDLORD"
      ? { visit: { unit: { ownerId: userId } } } // payments on the landlord's units
      : { userId }; // user's own payments

  const payments = await prisma.payment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      visit: {
        select: {
          id: true,
          proposedDate: true,
          status: true,
          unit: { select: { id: true, title: true, city: true } },
        },
      },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return payments;
}
