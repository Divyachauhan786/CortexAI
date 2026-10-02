import rateLimit from "express-rate-limit";

export const agentRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20,

    standardHeaders: true,
    legacyHeaders: false,

    message: {
        success: false,
        message:
            "Too many AI requests. Please wait a moment and try again.",
    },
});