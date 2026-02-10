import Stripe from "stripe";
import { env } from "../config/env.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-11-17.clover",
});


// Create payment intent to process payment
export async function createPaymentIntentUtil(amount, bookingId) {
  // Convert amount to smallest currency unit (piastres for EGP)
  // 1 EGP = 100 piastres
  const amountInPiastres = Math.round(amount * 100);

  // Stripe requires minimum 50 cents USD (~25 EGP as of 2026)
  // For EGP, this translates to approximately 2500 piastres minimum
  if (amountInPiastres < 2500) {
    throw new Error(
      `Amount too small for payment processing. Minimum amount is 25 EGP. Provided: ${amount} EGP`,
    );
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInPiastres,
    currency: "egp",
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      bookingId: bookingId,
    },
  });
  return paymentIntent;
}

// Retrieve payment intent to verify payment status
export async function retrievePaymentIntentUtil(paymentIntentId) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return paymentIntent;
}
