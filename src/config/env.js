const dotenv = require("dotenv");

dotenv.config({ quiet: true });

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: toNumber(process.env.PORT, 5000),
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/internal_project_management",
  JWT_SECRET: process.env.JWT_SECRET || "dev-only-change-this-secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  CORS_ORIGIN: (process.env.CORS_ORIGIN || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  REDIS_URL: process.env.REDIS_URL || "",
  RATE_LIMIT_WINDOW_MS: toNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  RATE_LIMIT_MAX: toNumber(process.env.RATE_LIMIT_MAX, 300)
};

if (env.NODE_ENV === "production" && env.JWT_SECRET === "dev-only-change-this-secret") {
  throw new Error("JWT_SECRET must be configured in production.");
}

module.exports = env;
