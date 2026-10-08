import crypto from "crypto";
import redis from "../config/redis.js";

const SESSION_EXPIRY = 60 * 60 * 24 * 7; // 7 days

// CREATE SESSION
export const createSession = async (userId) => {
    const sessionId = crypto.randomBytes(32).toString("hex");

    const sessionData = {
        userId: userId.toString(),
        createdAt: new Date().toISOString(),
    };

    try {
        await redis.set(
            `session:${sessionId}`,
            JSON.stringify(sessionData),
            "EX",
            SESSION_EXPIRY
        );
    } catch (err) {
        console.error("[Session] Failed to store session in Redis:", err.message);
        // Return the sessionId anyway — the cookie will be set but won't survive
        // a restart. Better than failing the entire login.
    }

    return sessionId;
};

// GET SESSION
export const getSession = async (sessionId) => {
    if (!sessionId) {
        return null;
    }

    try {
        const session = await redis.get(`session:${sessionId}`);

        if (!session) {
            return null;
        }

        return JSON.parse(session);
    } catch (err) {
        console.error("[Session] Failed to read session from Redis:", err.message);
        return null;
    }
};

// DELETE SESSION
export const deleteSession = async (sessionId) => {
    if (!sessionId) {
        return;
    }

    try {
        await redis.del(`session:${sessionId}`);
    } catch (err) {
        console.error("[Session] Failed to delete session from Redis:", err.message);
    }
};