import cors from "cors";
import express from "express";

import { env } from "./src/config/env.js";
import { connectDB, getDbHealth } from "./src/lib/db.js";
import { errorHandler, notFoundHandler } from "./src/middlewares/errorHandler.js";
import grievanceRoutes from "./src/routes/grievanceRoutes.js";

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

app.get("/api/grievances/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
        service: "grievance-service",
        db: getDbHealth(),
    });
});

app.use("/api/grievances", grievanceRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const bootstrap = async () => {
    try {
        await connectDB();
        app.listen(env.port, () => {
            console.log(`Grievance service is running on port ${env.port}`);
        });
    } catch (error) {
        console.error("Failed to bootstrap grievance service", error);
        process.exit(1);
    }
};

bootstrap();