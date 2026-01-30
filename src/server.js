import dotenv from "dotenv";
dotenv.config(); // 👈 SHOULD BE FIRST LINE
import { env } from "./config/env.js";
import app from "./app.js";
import logger from "./utils/logger.js";

app.listen(env.PORT, () => {
  logger.info(`Server is running on http://localhost:${env.PORT}/api/${env.APP_VERSION}`);
});
