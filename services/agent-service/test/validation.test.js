import test from "node:test";
import assert from "node:assert/strict";

test("basic validation test", () => {
    const request = {
        message: "Hello",
        userId: "test-user",
        history: [],
    };

    assert.equal(typeof request.message, "string");
    assert.equal(request.message.length > 0, true);
    assert.equal(typeof request.userId, "string");
    assert.deepEqual(request.history, []);
});