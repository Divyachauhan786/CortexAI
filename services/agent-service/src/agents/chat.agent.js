import llm from "../config/llm.js";

export const chatAgent = async (state) => {
    const response = await llm.invoke([
        {
            role: "system",
            content:
                "You are a helpful AI assistant. Answer the user's question clearly and accurately.",
        },
        ...state.messages,
    ]);

    return {
        messages: [response],
    };
};