import express from "express";
import router from "./routes/v1/ApiRouter.js";
import globalErrorHandler from "./middlewares/globalErrorHandler.js";
import page404Handler from "./middlewares/page404Handler.js";
import helmet from "helmet";
// Initialize Express app
const app = express();

// Middlewares setup
app.use(helmet());
app.use(express.json());
// Route setup
app.use("/api/v1", router);
// 404 Handler
app.use(page404Handler);
// Error handling middleware
app.use(globalErrorHandler); // should be last middleware

export default app;
