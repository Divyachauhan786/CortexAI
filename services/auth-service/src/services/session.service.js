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

    await redis.set(
        `session:${sessionId}`,
        JSON.stringify(sessionData),
        "EX",
        SESSION_EXPIRY
    );

    return sessionId;
};
// GET SESSION
export const getSession = async (sessionId) => {
    if (!sessionId) {
        return null;
    }

    const session = await redis.get(
        `session:${sessionId}`
    );

    if (!session) {
        return null;
    }

    return JSON.parse(session);
};

// DELETE SESSION

export const deleteSession = async (sessionId) => {
    if (!sessionId) {
        return;
    }

    await redis.del(
        `session:${sessionId}`
    );
};