import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import proxy from "express-http-proxy";

dotenv.config();

const app = express();

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
);

app.use(express.json());

// Auth Service
app.use(
    "/auth",
    proxy(process.env.AUTH_SERVICE, {
        proxyReqPathResolver: (req) => req.originalUrl,

        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            proxyReqOpts.headers = {
                ...proxyReqOpts.headers,
                cookie: srcReq.headers.cookie || "",
            };

            return proxyReqOpts;
        },
    })
);

// Chat Service
app.use(
    "/chat",
    proxy(process.env.CHAT_SERVICE, {
        proxyReqPathResolver: (req) => req.originalUrl,

        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            proxyReqOpts.headers = {
                ...proxyReqOpts.headers,
                cookie: srcReq.headers.cookie || "",
            };

            return proxyReqOpts;
        },
    })
);

// Agent Service
app.use(
    "/agent",
    proxy(process.env.AGENT_SERVICE, {
        proxyReqPathResolver: (req) => req.originalUrl,

        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            proxyReqOpts.headers = {
                ...proxyReqOpts.headers,
                cookie: srcReq.headers.cookie || "",
            };

            return proxyReqOpts;
        },
    })
);

app.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "Gateway is running",
    });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`Gateway running on http://localhost:${PORT}`);
});