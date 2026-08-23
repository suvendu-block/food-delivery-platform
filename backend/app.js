import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";

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

import userRouter from "./routes/userRoutes.js";
import restaurantRouter from "./routes/restaurantRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import menuRouter from "./routes/menuRoutes.js";
import reviewRouter from "./routes/reviewRoutes.js";

const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(limiter);
app.use(express.json({ limit: "10kb" }));
app.use(compression());
app.use(sanitizeMiddleware);
app.use(loggerMiddleware);

app.use("/api/users", userRouter);
app.use("/api/restaurants", restaurantRouter);
app.use("/api/orders", orderRouter);
app.use("/api/menus", menuRouter);
app.use("/api/reviews", reviewRouter);

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(globalErrorHandler);

export default app;
