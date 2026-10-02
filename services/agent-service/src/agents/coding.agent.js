import llm from "../config/llm.js";

export const codingAgent = async (state) => {
    const response = await llm.invoke([
        {
            role: "system",
            content: `
You are an expert software engineering assistant.

Help the user with:

- programming
- debugging
- algorithms
- data structures
- backend development
- frontend development
- APIs
- databases
- system design

Provide practical and correct answers.

When code is requested:
- provide working code
- explain important parts
- avoid unnecessary complexity

Relevant user memories:

${state.memoryContext || "No stored memories."}
            `,
        },

        ...state.messages,
    ]);

    return {
        messages: [response],
    };
};