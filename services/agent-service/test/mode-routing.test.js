import test from "node:test";
import assert from "node:assert/strict";
import chatGraph from "../src/graph/chat.graph.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test("Mode override should route to CHAT when mode is 'chat'", async () => {
    await sleep(2000);
    const result = await chatGraph.invoke({
        messages: [{ role: "user", content: "Write a quick hello" }],
        userId: "test-user-mode",
        mode: "chat",
    });

    assert.equal(result.status, "completed");
    const history = result.agentHistory || [];
    assert.ok(history.some((h) => h.agent === "CHAT"));
});

test("Mode override should route to CODING when mode is 'coding'", async () => {
    await sleep(2000);
    const result = await chatGraph.invoke({
        messages: [{ role: "user", content: "Implement two sum in python" }],
        userId: "test-user-mode",
        mode: "coding",
    });

    assert.equal(result.status, "completed");
    const history = result.agentHistory || [];
    assert.ok(history.some((h) => h.agent === "CODING"));
});

test("Mode override should route to RESEARCH when mode is 'search'", async () => {
    await sleep(4000);
    const result = await chatGraph.invoke({
        messages: [{ role: "user", content: "What is the capital of France" }],
        userId: "test-user-mode",
        mode: "search",
    });

    assert.equal(result.status, "completed");
    const history = result.agentHistory || [];
    assert.ok(history.some((h) => h.agent === "RESEARCH"));
});

test("Mode override should route to RAG when mode is 'pdf'", async () => {
    await sleep(2000);
    const result = await chatGraph.invoke({
        messages: [{ role: "user", content: "Summarize the document" }],
        userId: "test-user-mode",
        mode: "pdf",
    });

    assert.equal(result.status, "completed");
    const history = result.agentHistory || [];
    assert.ok(history.some((h) => h.agent === "RAG"));
});
