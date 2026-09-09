import "dotenv/config";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: null,
    retryStrategy(times) {
        const delay = Math.min(times * 200, 3000);
        return delay;
    },
});

redis.on("connect", () => {
    console.log("Redis connected");
});

redis.on("error", (error) => {
    console.error("Redis error:", error.message || error);
});

export default redis;