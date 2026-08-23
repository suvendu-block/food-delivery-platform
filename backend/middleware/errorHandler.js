import { AppError, ValidationError, AuthenticationError, AuthorizationError, NotFoundError } from "../utils/errors.js";
import { baseLogger } from "../utils/logger.js";

const logger = baseLogger.child({ module: "errorHandler" });

const globalErrorHandler = (err, req, res, next) => {
  logger.error(
    { err, requestId: req.requestId, path: req.path, method: req.method },
    "Unhandled error"
  );

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err instanceof ValidationError) {
    statusCode = 400;
    message = err.message;
  } else if (err instanceof AuthenticationError) {
    statusCode = 401;
    message = err.message;
  } else if (err instanceof AuthorizationError) {
    statusCode = 403;
    message = err.message;
  } else if (err instanceof NotFoundError) {
    statusCode = 404;
    message = err.message;
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for field: ${field}`;
  } else if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 400;
    message = "Invalid ID format";
  }

  const errorResponse = {
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  };

  res.status(statusCode).json(errorResponse);
};

export default globalErrorHandler;
