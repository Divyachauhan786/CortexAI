import llm from "../config/llm.js";
import searchTool from "../tools/search.tool.js";

const tools = [searchTool];

const modelWithTools = llm.bindTools(tools);

export const searchAgent = async (state) => {
    const response = await modelWithTools.invoke([
        {
            role: "system",
            content: `
You are a research assistant.

Use the web search tool whenever the user's question
requires current, recent, factual, or externally verified information.

After receiving search results, provide a clear and concise answer.

Do not claim that you searched the web if you did not actually use the tool.
`,
        },
        ...state.messages,
    ]);

    return {
        messages: [response],
    };
};