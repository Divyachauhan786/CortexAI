import test from "node:test";
import assert from "node:assert/strict";

import express from "express";
import { validateAgentRequest } from "../src/middleware/validate.agent.request.js";

const createTestApp = () => {
    const app = express();

    app.use(express.json());

    app.post(
        "/agent/run",
        validateAgentRequest,
        (req, res) => {
            res.status(200).json({
                success: true,
                data: req.body,
            });
        }
    );

    return app;
};

const makeRequest = async (app, body) => {
    const server = app.listen(0);

    const { port } = server.address();

    try {
        const response = await fetch(
            `http://127.0.0.1:${port}/agent/run`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            }
        );

        const data = await response.json();

        return {
            status: response.status,
            data,
        };
    } finally {
        server.close();
    }
};

test("Valid agent request should pass validation", async () => {
    const app = createTestApp();

    const result = await makeRequest(app, {
        message: "Hello",
        userId: "test-user",
        history: [],
    });

    assert.equal(result.status, 200);
    assert.equal(result.data.success, true);
});

test("Empty message should be rejected", async () => {
    const app = createTestApp();

    const result = await makeRequest(app, {
        message: "",
        userId: "test-user",
        history: [],
    });

    assert.equal(result.status, 400);
    assert.equal(result.data.success, false);
});

test("Missing userId should be rejected", async () => {
    const app = createTestApp();

    const result = await makeRequest(app, {
        message: "Hello",
        history: [],
    });

    assert.equal(result.status, 400);
    assert.equal(result.data.success, false);
});

test("Invalid history role should be rejected", async () => {
    const app = createTestApp();

    const result = await makeRequest(app, {
        message: "Hello",
        userId: "test-user",
        history: [
            {
                role: "invalid-role",
                content: "Previous message",
            },
        ],
    });

    assert.equal(result.status, 400);
    assert.equal(result.data.success, false);
});

test("Message longer than 10000 characters should be rejected", async () => {
    const app = createTestApp();

    const result = await makeRequest(app, {
        message: "A".repeat(10001),
        userId: "test-user",
        history: [],
    });

    assert.equal(result.status, 400);
    assert.equal(result.data.success, false);
});