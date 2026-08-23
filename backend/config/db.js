import mongoose from "mongoose";
import { env } from "./env.js";
import { baseLogger } from "../utils/logger.js";

const logger = baseLogger.child({ module: "db" });

export const connectDB = async () => {
  try {
    await mongoose.connect(env.mongodbUri);
    logger.info("MongoDB connected");
  } catch (error) {
    logger.error({ err: error }, "MongoDB connection error");
    process.exit(1);
  }
};

mongoose.connection.on("error", (err) => {
  logger.error({ err }, "MongoDB connection error");
});

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected");
});
