import test from "node:test";
import assert from "node:assert/strict";

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

test("Supervisor state should contain a user task", () => {
    const state = createState("What is the latest AI news?");

    assert.equal(state.task, "What is the latest AI news?");
    assert.equal(state.messages.length, 1);
    assert.equal(state.agentHistory.length, 0);
});

test("Coding task should be represented correctly", () => {
    const state = createState(
        "Write a C++ program to implement binary search"
    );

    assert.match(state.task, /C\+\+/);
    assert.match(state.task, /binary search/);
});

test("RAG task should be represented correctly", () => {
    const state = createState(
        "What is the expiry date mentioned in my uploaded certificate?"
    );

    assert.match(state.task, /uploaded certificate/);
});

test("Research task should be represented correctly", () => {
    const state = createState(
        "What are the latest developments in artificial intelligence?"
    );

    assert.match(state.task, /latest developments/);
});