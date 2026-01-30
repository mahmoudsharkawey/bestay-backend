import httpResponse from "../utils/httpResponse.js";
import os from "os";
import { env } from "../config/env.js";

const bytesToMB = (bytes) => (bytes / 1024 / 1024).toFixed(2) + " MB";

const HealthController = (req, res) => {
  const memoryUsage = process.memoryUsage();
  const timestamp = Date.now();

  const data = {
    application: {
      environment: env.NODE_ENV || "development",
      uptime: `${process.uptime().toFixed(2)} Second`,
      memoryUsage: {
        heapTotal: bytesToMB(memoryUsage.heapTotal),
        heapUsed: bytesToMB(memoryUsage.heapUsed),
      },
    },
    system: {
      cpuUsage: os.loadavg(),
      totalMemory: bytesToMB(os.totalmem()),
      freeMemory: bytesToMB(os.freemem()),
    },
    timestamp,
  };

  httpResponse(req, res, 200, "Health check successful", data);
};

export { HealthController };
