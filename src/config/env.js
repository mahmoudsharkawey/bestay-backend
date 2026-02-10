import dotenv from "dotenv";

dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  "NODE_ENV",
  "PORT",
  "DATABASE_URL",
  "JWT_SECRET",
  "STRIPE_SECRET_KEY",
  "EMAIL_USER",
  "EMAIL_PASS",
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error("❌ Missing required environment variables:");
  missingVars.forEach((varName) => {
    console.error(`   - ${varName}`);
  });
  console.error(
    "\nPlease check your .env file and ensure all required variables are set.",
  );
  console.error("See .env.example for reference.\n");
  process.exit(1);
}

export const env = {
  NODE_ENV: process.env.NODE_ENV,
  APP_VERSION: process.env.APP_VERSION,
  INFO_LEVEL: process.env.INFO_LEVEL,
  PORT: process.env.PORT,
  // Database
  DATABASE_URL: process.env.DATABASE_URL,
  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  // Rate limiting
  RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW,
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
  SIGNIN_RATE_LIMIT_WINDOW_MS: process.env.SIGNIN_RATE_LIMIT_WINDOW_MS,
  SIGNIN_RATE_LIMIT_MAX: process.env.SIGNIN_RATE_LIMIT_MAX,
  // Email configuration
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM,
  // OAuth configuration
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
  CLIENT_URL: process.env.CLIENT_URL,
  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  // STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
};
