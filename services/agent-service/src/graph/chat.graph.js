import {
    StateGraph,
    Annotation,
    START,
    END,
} from "@langchain/langgraph";

import { ToolNode } from "@langchain/langgraph/prebuilt";

import llm from "../config/llm.js";
import searchTool from "../tools/search.tool.js";

import { routerAgent } from "../agents/router.js";
import { chatAgent } from "../agents/chat.agent.js";
import { codingAgent } from "../agents/coding.agent.js";

const GraphState = Annotation.Root({
    messages: Annotation({
        reducer: (current, update) =>
            current.concat(update),
        default: () => [],
    }),

    route: Annotation({
        reducer: (_, update) => update,
        default: () => "",
    }),
});

const tools = [searchTool];

const searchModel = llm.bindTools(tools);

const searchAgent = async (state) => {
    const response = await searchModel.invoke([
        {
            role: "system",
            content: `
You are a research assistant.

Use the search tool when the question requires:
- current information
- recent information
- news
- prices
- factual web research
- external verification

After receiving the tool result, answer the user clearly.
`,
        },
        ...state.messages,
    ]);

    return {
        messages: [response],
    };
};

const toolNode = new ToolNode(tools);

const routeDecision = (state) => {
    switch (state.route) {
        case "SEARCH":
            return "search";

        case "CODING":
            return "coding";

        case "CHAT":
        default:
            return "chat";
    }
};

const searchDecision = (state) => {
    const lastMessage =
        state.messages[state.messages.length - 1];

    if (
        lastMessage.tool_calls &&
        lastMessage.tool_calls.length > 0
    ) {
        return "tools";
    }

    return "end";
};

const graph = new StateGraph(GraphState)

    // Router
    .addNode("router", routerAgent)

    // Agents
    .addNode("chat", chatAgent)
    .addNode("search", searchAgent)
    .addNode("coding", codingAgent)

    // Tools
    .addNode("tools", toolNode)

    // START → Router
    .addEdge(START, "router")

    // Router → Agent
    .addConditionalEdges(
        "router",
        routeDecision,
        {
            chat: "chat",
            search: "search",
            coding: "coding",
        }
    )

    // Chat/Coding → END
    .addEdge("chat", END)
    .addEdge("coding", END)

    // Search → Tool or END
    .addConditionalEdges(
        "search",
        searchDecision,
        {
            tools: "tools",
            end: END,
        }
    )

    // Tool → Search Agent
    .addEdge("tools", "search");

const chatGraph = graph.compile();

export default chatGraph;