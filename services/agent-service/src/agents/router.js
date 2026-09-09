import llm from "../config/llm.js";

export const routerAgent = async (state) => {
    const lastMessage =
        state.messages[state.messages.length - 1];

    const response = await llm.invoke([
        {
            role: "system",
            content: `
You are an AI request router.

Classify the user's request into exactly ONE category:

CHAT
SEARCH
CODING

Rules:

CHAT:
General questions, explanations, conversations, writing, casual requests.

SEARCH:
Requests asking for current information, latest information,
news, prices, weather, web research, or information that requires
external sources.

CODING:
Programming questions, debugging, code generation,
software engineering, algorithms, or technical implementation.

Return ONLY one word:
CHAT
SEARCH
or
CODING
            `,
        },
        {
            role: "user",
            content: lastMessage.content,
        },
    ]);

    return {
        route: response.content.trim().toUpperCase(),
    };
};