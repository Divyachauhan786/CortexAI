import dotenv from "dotenv";

dotenv.config();

import { supervisorAgent } from "./agents/supervisor.agent.js";

const testState = {
    messages: [
        {
            role: "user",
            content:
                "Explain how binary search works in C++",
        },
    ],

    task:
        "Explain how binary search works in C++",

    agentHistory: [],
};

const result =
    await supervisorAgent(testState);

console.log(
    "Supervisor Decision:"
);

console.log(
    JSON.stringify(
        result,
        null,
        2
    )
);