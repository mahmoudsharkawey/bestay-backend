import httpError from "../../utils/httpError.js";
import httpResponse from "../../utils/httpResponse.js";
import * as Payments from "./payment.service.js";

/**
 * POST /payments/intent
 * Body: { visitId }
 *
 * Creates a Stripe PaymentIntent for an APPROVED visit.
 * Returns the clientSecret needed by the client to confirm the payment.
 */
export const createPaymentIntent = async (req, res, next) => {
  try {
    const { visitId } = req.body;
    const userId = req.user.id;

    const result = await Payments.createPaymentIntent(visitId, userId);

    return httpResponse(
      req,
      res,
      201,
      "Payment intent created successfully",
      result,
    );
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return httpError(next, error, req, statusCode);
  }
};

/**
 * POST /payments/webhook
 *
 * Receives Stripe webhook events (raw body required for signature verification).
 * Handles payment_intent.succeeded to finalize payment records.
 *
 * This route must be registered with express.raw() BEFORE express.json().
 */
export const stripeWebhook = async (req, res, next) => {
  try {
    const sig = req.headers["stripe-signature"];
    // req.rawBody is the raw Buffer captured by the express.json() verify callback in app.js.
    // stripe.webhooks.constructEvent() MUST receive the raw bytes, not the parsed JSON object.
    const result = await Payments.handleStripeWebhook(req.rawBody, sig);
    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return httpError(next, error, req, statusCode);
  }
};

/**
 * POST /payments/:id/refund
 * Admin only.
 *
 * Issues a Stripe refund for a PAID payment and marks it as REFUNDED.
 * Intentionally NOT exposed to users — called by admin only.
 */
export const refundPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await Payments.refundPayment(id);
    return httpResponse(
      req,
      res,
      200,
      "Payment refunded successfully",
      payment,
    );
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return httpError(next, error, req, statusCode);
  }
};

/**
 * GET /payments/my
 * USER sees their own payments; LANDLORD sees payments on their units.
 */
export const getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payments.getMyPayments(req.user.id, req.user.role);
    return httpResponse(
      req,
      res,
      200,
      "Payments fetched successfully",
      payments,
    );
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return httpError(next, error, req, statusCode);
  }
};


export const getAllPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const payments = await Payments.getAllPayments(page, limit);
    return httpResponse(
      req,
      res,
      200,
      "Payments fetched successfully",
      payments,
    );
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return httpError(next, error, req, statusCode);
  }
};
