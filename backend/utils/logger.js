import pino from "pino";
import { v4 as uuidv4 } from "uuid";

// Create a base logger (used for app-level logs before request context)
export const baseLogger = pino({
  level: process.env.LOG_LEVEL || "info",
});

// Create a child logger with a request ID for correlation
export const createLogger = (requestId = uuidv4()) => {
  return baseLogger.child({ requestId });
};

// Middleware to attach logger and request ID to each request
export const loggerMiddleware = (req, res, next) => {
  const requestId = req.headers["x-request-id"] || uuidv4();
  req.requestId = requestId;
  req.logger = createLogger(requestId);

  // Log the incoming request
  req.logger.info({ method: req.method, path: req.path }, "Incoming request");

  // Log response when it finishes
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    req.logger.info(
      { method: req.method, path: req.path, statusCode: res.statusCode, duration: `${duration}ms` },
      "Request completed"
    );
  });

  next();
};
