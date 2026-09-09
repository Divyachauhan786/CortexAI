import llm from "../config/llm.js";

export const codingAgent = async (state) => {
    const response = await llm.invoke([
        {
            role: "system",
            content:
                "You are an expert software engineer. Help users write, understand, debug, and improve code.",
        },
        ...state.messages,
    ]);

    return {
        messages: [response],
    };
};