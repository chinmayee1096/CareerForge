import mongoose from "mongoose";
import logger from "../utils/logger.js";

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    logger.warn("MONGO_URI is missing. API will run, but database-backed routes will fail until MongoDB Atlas is configured.");
    return null;
  }

  mongoose.set("strictQuery", true);
  const connection = await mongoose.connect(process.env.MONGO_URI);
  logger.info(`MongoDB connected: ${connection.connection.host}`);
  return connection;
};

export default connectDB;
