import "dotenv/config";

import express from "express";
import agentRoutes from "./routes/agent.routes.js";

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

app.listen(PORT, () => {
    console.log(
        `Agent Service running on http://localhost:${PORT}`
    );
});