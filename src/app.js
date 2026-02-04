import express from "express";
import helmet from "helmet";
import cors from "cors";
import router from "./routes/v1/ApiRouter.js";
import globalErrorHandler from "./middlewares/globalErrorHandler.js";
import page404Handler from "./middlewares/page404Handler.js";
import { apiLimiter } from "./middlewares/rateLimiterMiddleware.js";

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
app.use(express.json());

// Route setup (apply rate limiter to API routes)
app.use("/api/v1", apiLimiter, router);

// 404 Handler
app.use(page404Handler);
// Error handling middleware
app.use(globalErrorHandler); // should be last middleware

export default app;
