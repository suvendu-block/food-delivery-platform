import pino from "pino";
import { v4 as uuidv4 } from "uuid";

export const baseLogger = pino({
  level: process.env.LOG_LEVEL || "info",
});

const childLogger = baseLogger.child({ module: "app" });

export const loggerMiddleware = (req, res, next) => {
  req.requestId = req.requestId || uuidv4();
  req.log = childLogger.child({ requestId: req.requestId });

  const start = Date.now();
  req.log.info({ method: req.method, path: req.path }, "Incoming request");

  res.on("finish", () => {
    const duration = Date.now() - start;
    req.log.info(
      { method: req.method, path: req.path, statusCode: res.statusCode, duration: `${duration}ms` },
      "Request completed"
    );
  });

  next();
};

export const logger = childLogger;
