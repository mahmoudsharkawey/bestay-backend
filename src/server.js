import dotenv from "dotenv";
dotenv.config(); // 👈 FIRST LINE
import { env } from "./config/env.js";
import app from "./app.js";

app.listen(env.PORT, () => {
  console.log(`🚀 Server running on port ${env.PORT}`);
});
