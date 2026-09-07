import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import proxy from "express-http-proxy";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 8000;

// CORS

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
);

// BODY PARSER

app.use(express.json());

// HEALTH CHECK

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "AI Workspace API Gateway is running",
    });
});

// AUTH SERVICE

app.use(
    "/auth",
    proxy(process.env.AUTH_SERVICE, {
        proxyReqPathResolver: (req) => {
            return req.originalUrl;
        },
    })
);

// CHAT SERVICE

app.use(
    "/chat",
    proxy(process.env.CHAT_SERVICE, {
        proxyReqPathResolver: (req) => {
            return req.originalUrl;
        },
    })
);

// AGENT SERVICE

app.use(
    "/agent",
    proxy(process.env.AGENT_SERVICE, {
        proxyReqPathResolver: (req) => {
            return req.originalUrl;
        },
    })
);

// BILLING SERVICE

app.use(
    "/billing",
    proxy(process.env.BILLING_SERVICE, {
        proxyReqPathResolver: (req) => {
            return req.originalUrl;
        },
    })
);

// GLOBAL ERROR HANDLER

app.use((err, req, res, next) => {
    console.error("Gateway Error:", err);

    res.status(500).json({
        success: false,
        message: "Gateway internal server error",
    });
});

// START SERVER

app.listen(PORT, () => {
    console.log(
        `Gateway running on http://localhost:${PORT}`
    );
});