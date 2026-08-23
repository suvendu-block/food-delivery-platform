import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";

// NoSQL injection sanitizer (express-mongo-sanitize v2 is incompatible with Express 5)
const mongoSanitize = (obj) => {
  if (obj && typeof obj === "object") {
    for (const key of Object.keys(obj)) {
      if (key.startsWith("$") || key.includes(".")) {
        delete obj[key];
      } else if (typeof obj[key] === "object") {
        mongoSanitize(obj[key]);
      }
    }
  }
  return obj;
};

const sanitizeMiddleware = (req, res, next) => {
  if (req.body) mongoSanitize(req.body);
  if (req.params) mongoSanitize(req.params);
  next();
};

import { corsOptions } from "./config/env.js";
import { loggerMiddleware } from "./utils/logger.js";
import { limiter } from "./middleware/rateLimiter.js";
import globalErrorHandler from "./middleware/errorHandler.js";

// Route imports
import userRouter from "./routes/userRoutes.js";
import restaurantRouter from "./routes/restaurantRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import menuRouter from "./routes/menuRoutes.js";
import reviewRouter from "./routes/reviewRoutes.js";

const app = express();

// ─── Security Middleware ────────────────────────────────────────────
app.use(helmet());
app.use(cors(corsOptions));
app.use(limiter);

// ─── Parsing & Compression ──────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(compression());
app.use(sanitizeMiddleware);

// ─── Logging ────────────────────────────────────────────────────────
app.use(loggerMiddleware);

// ─── Routes ─────────────────────────────────────────────────────────
app.use("/api/users", userRouter);
app.use("/api/restaurants", restaurantRouter);
app.use("/api/orders", orderRouter);
app.use("/api/menus", menuRouter);
app.use("/api/reviews", reviewRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler (must be last)
app.use(globalErrorHandler);

export default app;
