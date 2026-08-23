import rateLimit from "express-rate-limit";

const noop = (_req, _res, next) => next();
const isTest = process.env.NODE_ENV === "test";

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
