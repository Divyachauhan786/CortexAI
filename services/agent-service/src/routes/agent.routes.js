import express from "express";

import {
    runAgent,
    streamAgent,
} from "../controllers/agent.controller.js";

import {
    validateAgentRequest,
} from "../middleware/validate.agent.request.js";

import {
    agentRateLimiter,
} from "../middleware/rate.limit.js";

const router = express.Router();

router.post(
    "/run",
    agentRateLimiter,
    validateAgentRequest,
    runAgent
);

router.post(
    "/stream",
    agentRateLimiter,
    validateAgentRequest,
    streamAgent
);

export default router;