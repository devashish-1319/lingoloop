import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error({ err: error }, "Error in connecting to MongoDB");
    process.exit(1); // 1 means failure
  }
};
