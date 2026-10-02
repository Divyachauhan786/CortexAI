import dotenv from "dotenv";

dotenv.config();

import connectDB from "./config/mongodb.js";

import memoryExtractor from "./services/memory-extractor.service.js";

import {
    saveExtractedMemories,
} from "./services/memory-persistence.service.js";

import {
    getMemories,
} from "./services/memory.service.js";


const run = async () => {
    try {
        await connectDB();

        // TEMPORARY TEST USER
        const userId = "memory-test-user-001";

        const messages = [
            {
                role: "user",
                content:
                    "I prefer explanations in Hinglish and I am learning MERN stack.",
            },
            {
                role: "assistant",
                content:
                    "Sure! I will explain MERN concepts in a beginner-friendly way.",
            },
            {
                role: "user",
                content:
                    "My goal is to get a software engineering internship.",
            },
        ];

        console.log(
            "\nExtracting memories..."
        );

        const memories =
            await memoryExtractor(messages);

        console.log(
            "\nExtracted memories:"
        );

        console.log(memories);


        console.log(
            "\nSaving memories to MongoDB..."
        );

        const savedMemories =
            await saveExtractedMemories({
                userId,
                memories,
            });

        console.log(
            "\nSaved memories:"
        );

        console.log(savedMemories);


        console.log(
            "\nReading memories from MongoDB..."
        );

        const storedMemories =
            await getMemories(userId);

        console.log(
            "\nStored memories:"
        );

        console.log(storedMemories);


        process.exit(0);

    } catch (error) {

        console.error(
            "\nMemory test failed:",
            error
        );

        process.exit(1);
    }
};

run();