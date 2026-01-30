import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "../config/env.js";
import {
  red,
  yellow,
  green,
  blue,
  magenta,
  cyan,
  dim,
  bold,
  bgWhiteBright,
  magentaBright,
} from "colorette";

// Ensure logs directory exists
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, "../../logs");
// Define log formats
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaString = Object.keys(meta).length
      ? ` ${JSON.stringify(meta)}`
      : "";
    return `${timestamp} [${level.toUpperCase()}]: ${message}${metaString}${stack ? "\n" + stack : ""}`;
  }),
);

// Color mapping for different log levels
const colorForLevel = (level) => {
  switch (level) {
    case "error":
      return red;
    case "warn":
      return yellow;
    case "info":
      return green;
    case "http":
      return cyan;
    case "verbose":
      return magenta;
    case "debug":
      return blue;
    default:
      return dim;
  }
};

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : "";
    const color = colorForLevel(level);
    const coloredLevel = bold(color(level.toUpperCase()));
    const coloredTimestamp = bgWhiteBright(timestamp);
    const coloredMessage = color(message);

    return `${coloredTimestamp} [${coloredLevel}]: ${coloredMessage}${metaString ? `\n${magentaBright(metaString)}\n` : ""}${stack ? "\n" + dim(stack) : ""}`;
  }),
);

// Create the logger instance
const logger = winston.createLogger({
  level: env.INFO_LEVEL || "info",
  defaultMeta: {},
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      format: fileFormat,
    }),
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

export default logger;
