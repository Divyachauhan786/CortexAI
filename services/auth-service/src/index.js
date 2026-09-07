import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";

dotenv.config();

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

// HEALTH CHECK


app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "AI Workspace Auth Service is running",
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