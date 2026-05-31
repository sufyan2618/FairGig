import cors from "cors";
import express from "express";

import { env } from "./src/config/env.js";
import { connectDB, getDbHealth } from "./src/lib/db.js";
import { errorHandler, notFoundHandler } from "./src/middlewares/errorHandler.js";
import grievanceRoutes from "./src/routes/grievanceRoutes.js";
import { logger, requestLogger } from "./src/utils/logger.js";
import "./src/utils/tracing.js";
import client from "prom-client";

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: env.corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use((req, res, next) => {
  const startMs = performance.now();
  requestLogger(req, res, startMs);
  next();
});

app.get("/api/grievances/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "grievance-service",
    db: getDbHealth(),
  });
});

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.use("/api/grievances", grievanceRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const bootstrap = async () => {
  try {
    await connectDB();
    app.listen(env.port, () => {
      logger.info("grievance-service started", { event: "service_start", port: env.port });
    });
  } catch (error) {
    logger.error("failed to bootstrap grievance service", error, { event: "service_start_failed" });
    process.exit(1);
  }
};

bootstrap();
