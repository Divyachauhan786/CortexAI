import dotenv from "dotenv";

dotenv.config();

import memoryExtractor from "./services/memory-extractor.service.js";

const messages = [
    {
        role: "user",
        content:
            "I am learning MERN stack and I prefer explanations in Hinglish.",
    },
    {
        role: "assistant",
        content:
            "Sure! I can explain MERN concepts step by step.",
    },
    {
        role: "user",
        content:
            "My goal is to get a software engineering internship.",
    },
];

const run = async () => {
    try {
        const result = await memoryExtractor(messages);

        console.log("\nExtracted Memories:\n");
        console.log(result);
    } catch (error) {
        console.error(
            "Memory extraction failed:",
            error.message
        );
    }
};

run();