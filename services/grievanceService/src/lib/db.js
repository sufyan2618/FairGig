import mongoose from "mongoose";

import { env } from "../config/env.js";

export const connectDB = async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri, {
    autoIndex: true,
    maxPoolSize: 20,
  });
};

export const getDbHealth = () => {
  const stateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return stateMap[mongoose.connection.readyState] ?? "unknown";
};