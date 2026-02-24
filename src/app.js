import express from "express";
import helmet from "helmet";
import cors from "cors";
import router from "./routes/v1/ApiRouter.js";
import globalErrorHandler from "./middlewares/globalErrorHandler.js";
import page404Handler from "./middlewares/page404Handler.js";
import { apiLimiter } from "./middlewares/rateLimiterMiddleware.js";
import { stripeWebhook } from "./features/payment/payment.controller.js";

// Initialize Express app
const app = express();

// Middlewares setup
app.use(helmet());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// ⚠️  express.json() with a `verify` callback — Stripe's recommended approach.
//     The verify function runs BEFORE the body is parsed, giving us access to
//     the original raw Buffer. We save it to req.rawBody so the webhook handler
//     can use it for signature verification regardless of the middleware order.
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

// Stripe webhook — must come AFTER the json middleware so req.rawBody is populated,
// but the handler uses req.rawBody (not req.body) for signature verification.
app.post("/api/v1/payments/webhook", stripeWebhook);

// Route setup (apply rate limiter to API routes)
app.use("/api/v1", apiLimiter, router);

// 404 Handler
app.use(page404Handler);
// Error handling middleware
app.use(globalErrorHandler); // should be last middleware

export default app;
