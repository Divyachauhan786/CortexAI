import "dotenv/config";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    // Don't block the process on import — connect lazily on first command.
    lazyConnect: true,
    // Null means the client won't throw "ReplyError: Stream isn't writeable"
    // for commands that are queued while reconnecting.
    maxRetriesPerRequest: null,
    retryStrategy(times) {
        if (times > 10) {
            console.error(
                "[Redis] Unable to connect after 10 retries. " +
                "Sessions will not work until Redis is available. " +
                "Run: docker run -d --name redis-local -p 6379:6379 redis:7-alpine"
            );
            // Stop retrying — returning null tells ioredis to stop.
            return null;
        }
        return Math.min(times * 300, 3000);
    },
    reconnectOnError(err) {
        // Reconnect on READONLY errors (Redis Cluster failover)
        return err.message.includes("READONLY");
    },
});

redis.on("connect", () => {
    console.log("[Redis] Connected successfully");
});

redis.on("ready", () => {
    console.log("[Redis] Ready to accept commands");
});

redis.on("error", (error) => {
    // Suppress repeated ECONNREFUSED spam after the first message
    if (error.code !== "ECONNREFUSED" && !error.message?.includes("ECONNREFUSED")) {
        console.error("[Redis] Error:", error.message || error);
    }
});

redis.on("close", () => {
    console.warn("[Redis] Connection closed");
});

// Attempt the initial connection without crashing if it fails
redis.connect().catch(() => {
    // Connection error is already logged by the 'error' event handler
});

export default redis;