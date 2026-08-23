import rateLimit from "express-rate-limit";

// Pass-through middleware for test environment (no rate limiting)
const noop = (_req, _res, next) => next();

const isTest = process.env.NODE_ENV === "test";

// Base rate limiter — 100 requests per 15 minutes per IP
export const limiter = isTest ? noop : rateLimit({
  max: 100,
  windowMs: 15 * 60 * 1000,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for auth routes — 5 attempts per 15 minutes
export const authLimiter = isTest ? noop : rateLimit({
  max: 5,
  windowMs: 15 * 60 * 1000,
  message: {
    success: false,
    message: "Too many login attempts, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for order creation — 10 per minute
export const orderLimiter = isTest ? noop : rateLimit({
  max: 10,
  windowMs: 60 * 1000,
  message: {
    success: false,
    message: "Too many order attempts, please try again in a minute",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
