import mongoose from "mongoose";
import env from "../config/env.js";
import logger from "../config/logger.js";

export async function connectDB(mongoUri: string = env.MONGO_URL): Promise<void> {
  await mongoose.connect(mongoUri);
  logger.info("Database connected successfully");
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  logger.info("Database disconnected");
}

export default connectDB;
