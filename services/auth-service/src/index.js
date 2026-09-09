import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import redis from "./config/redis.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

const PORT = process.env.PORT || 8001;

// DATABASE
await connectDB();

// MIDDLEWARE

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
);

app.use(express.json());

app.use(cookieParser());

// HEALTH CHECK
app.get("/", async (req, res) => {
    res.json({
        success: true,
        message: "AI Workspace Auth Service is running",
        redis: redis.status,
    });
});

// AUTH ROUTES
app.use("/auth", authRoutes);
// START SERVER
app.listen(PORT, () => {
    console.log(
        ` Auth Service running on http://localhost:${PORT}`
    );
});