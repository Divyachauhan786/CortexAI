import dotenv from "dotenv";

dotenv.config();

import connectDB from "./config/mongodb.js";
import {
    upsertMemory,
    getMemories,
} from "./services/memory.service.js";

const run = async () => {
    await connectDB();

    const userId = "YOUR_USER_ID";

    await upsertMemory({
        userId,
        key: "preferred_explanation_style",
        value: "Explain concepts in beginner-friendly Hinglish",
        source: "explicit",
        importance: 0.9,
    });

    const memories = await getMemories(userId);

    console.log("Stored memories:");
    console.log(memories);

    process.exit(0);
};

run();