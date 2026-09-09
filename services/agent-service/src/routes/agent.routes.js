import express from "express";
import { runAgent } from "../controllers/agent.controller.js";

const router = express.Router();

router.post("/run", runAgent);

export default router;