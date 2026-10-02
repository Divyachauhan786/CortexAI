import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import chatRoutes from "./routes/chat.routes.js";

const app = express();

const PORT = process.env.PORT || 8002;

// DATABASE

await connectDB();

// MIDDLEWARE

app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
    })
);

app.use(express.json());

app.use(cookieParser());

// HEALTH CHECK

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "AI Workspace Chat Service is running",
    });
});

// CHAT ROUTES

app.use(
    "/chat",
    chatRoutes
);

// START SERVER


app.listen(PORT, () => {
    console.log(
        ` Chat Service running on http://localhost:${PORT}`
    );
});