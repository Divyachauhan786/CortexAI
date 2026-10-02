import test from "node:test";
import assert from "node:assert/strict";

import { supervisorAgent } from "../src/agents/supervisor.agent.js";

const createState = (message) => ({
    messages: [
        {
            role: "user",
            content: message,
        },
    ],
    task: message,
    agentHistory: [],
    iterationCount: 0,
});

test("Supervisor should route a simple conversation to CHAT", async () => {
    const state = createState("Hello, how are you?");

    const result = await supervisorAgent(state);

    assert.equal(result.nextAgent, "CHAT");
    assert.equal(typeof result.reason, "string");
    assert.equal(typeof result.needsMoreWork, "boolean");
});

test("Supervisor should route a coding task to CODING", async () => {
    const state = createState(
        "Write a C++ program to implement binary search"
    );

    const result = await supervisorAgent(state);

    assert.equal(result.nextAgent, "CODING");
});

test("Supervisor should route a document question to RAG", async () => {
    const state = createState(
        "What is the expiry date mentioned in my uploaded certificate?"
    );

    const result = await supervisorAgent(state);

    assert.equal(result.nextAgent, "RAG");
});

test("Supervisor should route a current information task to RESEARCH", async () => {
    const state = createState(
        "What are the latest developments in artificial intelligence?"
    );

    const result = await supervisorAgent(state);

    assert.equal(result.nextAgent, "RESEARCH");
});