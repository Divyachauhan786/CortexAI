import dotenv from "dotenv";

dotenv.config();

import express from "express";
import agentRoutes from "./routes/agent.routes.js";

import memoryRoutes from "./routes/memory.routes.js";
import documentRoutes from "./routes/document.routes.js";
import connectDB from "./config/mongodb.js";
import {
    initializeCollection,
} from "./services/qdrant.service.js";
const app = express();

const PORT = process.env.PORT || 8003;

app.use(express.json());


app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "AI Workspace Agent Service is running",
    });
});


app.use("/agent", agentRoutes);


app.use("/agent/memory", memoryRoutes);
app.use(
    "/agent/documents",
    documentRoutes
);

connectDB()
    .then(async () => {
        // Qdrant is optional for local dev — RAG features degrade gracefully
        // if it's not running. Start Qdrant with:
        //   docker run -d --name qdrant-local -p 6333:6333 qdrant/qdrant:v1.13.4
        try {
            await initializeCollection();
        } catch (qdrantError) {
            console.warn(
                "[Agent Service] Qdrant unavailable — RAG/document features disabled.",
                qdrantError.message
            );
        }

        app.listen(PORT, () => {
            console.log(
                `Agent Service running on http://localhost:${PORT}`
            );
        });
    })
    .catch((error) => {
        console.error(
            "Failed to start Agent Service:",
            error.message,
            error
        );
    });