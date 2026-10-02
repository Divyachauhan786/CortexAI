import { HumanMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import llm from "../config/llm.js";
import searchTool from "../tools/search.tool.js";

const researchModel = llm.bindTools([searchTool]);

export const researchAgent = async (state) => {
    const messages = state.messages || [];

    const userMessage = messages[messages.length - 1];

    const systemMessage = {
        role: "system",
        content: `
You are the Research Agent.

Your job is to answer questions that require current,
external, or web-based information.

Rules:
- Use the web search tool when current or external information is required.
- Do not use web search for simple questions that you already know.
- After receiving search results, summarize the useful information clearly.
- Do not invent facts.
- If search results are insufficient, clearly say so.
- Do not expose internal reasoning or tool execution details.
        `,
    };

    const response = await researchModel.invoke([
        systemMessage,
        ...messages,
    ]);

    // If the model requested a tool, execute it.
    if (response.tool_calls && response.tool_calls.length > 0) {
        const toolMessages = [];

        for (const toolCall of response.tool_calls) {
            if (toolCall.name === searchTool.name) {
                const result = await searchTool.invoke(toolCall.args);

                toolMessages.push(
                    new ToolMessage({
                        content:
                            typeof result === "string"
                                ? result
                                : JSON.stringify(result),
                        tool_call_id: toolCall.id,
                    })
                );
            }
        }

        const finalResponse = await researchModel.invoke([
            systemMessage,
            ...messages,
            response,
            ...toolMessages,
        ]);

        return {
            messages: [finalResponse],
            researchContext:
                typeof finalResponse.content === "string"
                    ? finalResponse.content
                    : JSON.stringify(finalResponse.content),
            agentHistory: [
                {
                    agent: "RESEARCH",
                    status: "completed",
                    toolUsed: true,
                },
            ],
        };
    }

    return {
        messages: [response],
        researchContext:
            typeof response.content === "string"
                ? response.content
                : JSON.stringify(response.content),
        agentHistory: [
            {
                agent: "RESEARCH",
                status: "completed",
                toolUsed: false,
            },
        ],
    };
};