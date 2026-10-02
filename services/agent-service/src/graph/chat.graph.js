
import {
    StateGraph,
    START,
    END,
} from "@langchain/langgraph";

import { AgentState } from "../state/agent.state.js";
import { researchAgent } from "../agents/research.agent.js";
import { supervisorAgent } from "../agents/supervisor.agent.js";

import { chatAgent } from "../agents/chat.agent.js";
import { codingAgent } from "../agents/coding.agent.js";
import { ragAgent } from "../agents/rag.agent.js";
import {
    logAgentStart,
    logAgentSuccess,
    logAgentError,
} from "../utils/agent.logger.js";
import llm from "../config/llm.js";
import toolRegistry from "../tools/tool.registry.js";

const toolModel = llm.bindTools(toolRegistry);

// ======================================================
// TOOL-CAPABLE AGENT
// ======================================================

const toolAgent = async (state) => {
    const response = await toolModel.invoke([
        {
            role: "system",

            content: `
You are an intelligent AI research assistant.

You have access to tools.

Available tools:

1. Web Search
   Use for:
   - latest information
   - current events
   - recent news
   - current prices
   - external information requiring web research

2. Calculator
   Use for:
   - arithmetic
   - mathematical calculations
   - numerical expressions

Relevant user memories:

${state.memoryContext || "No stored memories."}

Use a tool when it is genuinely useful or necessary.

For simple questions that do not require a tool,
answer directly.

After receiving a tool result,
use that result to provide the final answer.

Do not expose internal reasoning.
            `,
        },

        ...state.messages,
    ]);

    return {
        messages: [response],
    };
};

// ======================================================
// SUPERVISOR NODE
// ======================================================

const supervisorNode = async (state) => {
    const iterationCount = state.iterationCount || 0;

    const startTime = logAgentStart({
        agent: "SUPERVISOR",
        iteration: iterationCount,
    });

    try {
        if (iterationCount >= 8) {
            console.log(
                "[Supervisor] Maximum iteration limit reached → FINAL"
            );

            logAgentSuccess({
                agent: "SUPERVISOR",
                startTime,
                iteration: iterationCount,
                metadata: {
                    decision: "FINAL",
                    reason: "Maximum iteration limit reached",
                },
            });

            return {
                nextAgent: "FINAL",
                status: "completed",
                iterationCount,
            };
        }

        const agentHistory = state.agentHistory || [];

        const completedAgents = agentHistory
            .filter(
                (item) =>
                    item.agent &&
                    item.agent !== "SUPERVISOR"
            )
            .map((item) => item.agent);

        if (
            completedAgents.includes("CHAT") &&
            !completedAgents.includes("RESEARCH") &&
            !completedAgents.includes("CODING") &&
            !completedAgents.includes("RAG") &&
            !completedAgents.includes("PLANNING") &&
            !completedAgents.includes("REVIEW")
        ) {
            console.log(
                "[Supervisor] CHAT completed → FINAL"
            );

            logAgentSuccess({
                agent: "SUPERVISOR",
                startTime,
                iteration: iterationCount,
                metadata: {
                    decision: "FINAL",
                    reason: "CHAT completed",
                },
            });

            return {
                nextAgent: "FINAL",
                status: "completed",
                iterationCount: iterationCount + 1,
            };
        }

        // Mode override for direct agent routing from workspace mode selector
        if (iterationCount === 0 && state.mode && state.mode !== "auto") {
            const modeMap = {
                chat: "CHAT",
                coding: "CODING",
                search: "RESEARCH",
                research: "RESEARCH",
                pdf: "RAG",
                rag: "RAG",
            };
            const forcedAgent = modeMap[state.mode.toLowerCase()];
            if (forcedAgent) {
                console.log(
                    `[Supervisor] Mode override: ${state.mode} → ${forcedAgent}`
                );

                logAgentSuccess({
                    agent: "SUPERVISOR",
                    startTime,
                    iteration: iterationCount,
                    metadata: {
                        decision: forcedAgent,
                        reason: `Mode explicitly set to ${state.mode}`,
                        override: true,
                    },
                });

                return {
                    nextAgent: forcedAgent,
                    iterationCount: iterationCount + 1,
                    status: "running",
                    agentHistory: [
                        {
                            agent: "SUPERVISOR",
                            selected: forcedAgent,
                            status: "completed",
                        },
                    ],
                };
            }
        }

        const decision = await supervisorAgent(state);

        console.log(
            `[Supervisor] ${decision.nextAgent} | ${decision.reason}`
        );

        logAgentSuccess({
            agent: "SUPERVISOR",
            startTime,
            iteration: iterationCount,
            metadata: {
                decision: decision.nextAgent,
                needsMoreWork: decision.needsMoreWork,
            },
        });

        return {
            nextAgent: decision.nextAgent,
            iterationCount: iterationCount + 1,
            status: "running",
            agentHistory: [
                {
                    agent: "SUPERVISOR",
                    selected: decision.nextAgent,
                    status: "completed",
                },
            ],
        };
    } catch (error) {
        logAgentError({
            agent: "SUPERVISOR",
            startTime,
            iteration: iterationCount,
            error,
        });

        throw error;
    }
};

// ======================================================
// SUPERVISOR ROUTING
// ======================================================

const supervisorDecision = (state) => {
    switch (state.nextAgent) {
        case "CHAT":
            return "chat";

        case "RESEARCH":
            return "research";

        case "CODING":
            return "coding";

        case "RAG":
            return "rag";

        case "PLANNING":
            return "planning";

        case "REVIEW":
            return "reviewAgent";

        case "FINAL":
            return "final";

        default:
            return "chat";
    }
};

// ======================================================
// RESEARCH AGENT
// ======================================================
//
// Temporary Step 17.3 implementation.
//
// It reuses the existing tool-capable agent.
// We will extract this into a dedicated
// research.agent.js in a later step.
//



// ======================================================
// PLANNING AGENT
// ======================================================

const planningAgent = async (state) => {
    const response = await llm.invoke([
        {
            role: "system",

            content: `
You are the Planning Agent.

Create a clear, practical plan for the user's task.

Break complex work into logical steps.

Do not execute the plan.

Do not expose hidden reasoning.

Return only the useful plan.
            `,
        },

        ...state.messages,
    ]);

    return {
        messages: [response],

        plan:
            typeof response.content === "string"
                ? response.content
                : JSON.stringify(response.content),

        agentHistory: [
            {
                agent: "PLANNING",
                status: "completed",
            },
        ],
    };
};

// ======================================================
// REVIEW AGENT
// ======================================================

const reviewAgent = async (state) => {
    const response = await llm.invoke([
        {
            role: "system",

            content: `
You are the Review Agent.

Review the available task context and determine
whether the work is complete and suitable to return
to the user.

Available context:

RESEARCH:
${state.researchContext || "None"}

CODE:
${state.codeContext || "None"}

RAG:
${state.retrievalContext || "None"}

PLAN:
${state.plan || "None"}

Do not expose hidden reasoning.

Return a concise review.
            `,
        },

        ...state.messages,
    ]);

    const reviewContent =
        typeof response.content === "string"
            ? response.content
            : JSON.stringify(response.content);

    return {
        messages: [response],

        review: reviewContent,

        agentHistory: [
            {
                agent: "REVIEW",
                status: "completed",
            },
        ],
    };
};

// ======================================================
// FINAL AGENT
// ======================================================

const finalAgent = async (state) => {
    let finalResponse = "";

    // Prefer the actual result produced by the specialized agent.
    if (state.researchContext) {
        finalResponse = state.researchContext;
    } else if (state.codeContext) {
        finalResponse = state.codeContext;
    } else if (state.retrievalContext) {
        finalResponse = state.retrievalContext;
    } else if (state.plan) {
        finalResponse = state.plan;
    } else {
        const lastMessage =
            state.messages?.[state.messages.length - 1];

        finalResponse =
            typeof lastMessage?.content === "string"
                ? lastMessage.content
                : JSON.stringify(
                      lastMessage?.content || ""
                  );
    }

    return {
        finalResponse,
        status: "completed",
    };
};

// ======================================================
// AGENT HISTORY HELPER
// ======================================================

const addAgentHistory = (
    agent,
    status = "completed"
) => ({
    agentHistory: [
        {
            agent,
            status,
        },
    ],
});

// ======================================================
// GRAPH
// ======================================================

const graph =
    new StateGraph(AgentState)

        // ==================================================
        // SUPERVISOR
        // ==================================================

        .addNode(
            "supervisor",
            supervisorNode
        )

        // ==================================================
        // CHAT
        // ==================================================

        .addNode(
            "chat",
            async (state) => {
                const result =
                    await chatAgent(state);

                return {
                    ...result,

                    ...addAgentHistory(
                        "CHAT"
                    ),
                };
            }
        )

        // ==================================================
        // CODING
        // ==================================================

        .addNode(
            "coding",
            async (state) => {
                const result =
                    await codingAgent(state);

                const lastMessage =
                    result.messages?.[
                        result.messages.length - 1
                    ];

                const codeContent =
                    typeof lastMessage?.content ===
                    "string"
                        ? lastMessage.content
                        : JSON.stringify(
                              lastMessage?.content ||
                                  ""
                          );

                return {
                    ...result,

                    codeContext:
                        codeContent,

                    ...addAgentHistory(
                        "CODING"
                    ),
                };
            }
        )

        // ==================================================
        // RAG
        // ==================================================

        .addNode(
            "rag",
            async (state) => {
                const result =
                    await ragAgent(state);

                return {
                    ...result,

                    ...addAgentHistory(
                        "RAG"
                    ),
                };
            }
        )

        // ==================================================
        // RESEARCH
        // ==================================================

       .addNode("research", async (state) => {
    return await researchAgent(state);
})

        // ==================================================
        // PLANNING
        // ==================================================

        .addNode(
            "planning",
            planningAgent
        )

        // ==================================================
        // REVIEW
        // ==================================================
        //
        // IMPORTANT:
        // The state already contains a `review` channel.
        // Therefore the node cannot also be named `review`.
        //
        // We use `reviewAgent` as the graph node name.
        //

        .addNode(
            "reviewAgent",
            reviewAgent
        )

        // ==================================================
        // FINAL
        // ==================================================

        .addNode(
            "final",
            finalAgent
        )

        // ==================================================
        // START
        // ==================================================

        .addEdge(
            START,
            "supervisor"
        )

        // ==================================================
        // SUPERVISOR → AGENT
        // ==================================================

        .addConditionalEdges(
            "supervisor",
            supervisorDecision,
            {
                chat: "chat",

                research:
                    "research",

                coding:
                    "coding",

                rag:
                    "rag",

                planning:
                    "planning",

                reviewAgent:
                    "reviewAgent",

                final:
                    "final",
            }
        )

        // ==================================================
        // AGENT → SUPERVISOR
        // ==================================================

        .addEdge(
            "chat",
            "supervisor"
        )

        .addEdge(
            "coding",
            "supervisor"
        )

        .addEdge(
            "rag",
            "supervisor"
        )

        .addEdge(
            "research",
            "supervisor"
        )

        .addEdge(
            "planning",
            "supervisor"
        )

        .addEdge(
            "reviewAgent",
            "supervisor"
        )

        // ==================================================
        // FINAL → END
        // ==================================================

        .addEdge(
            "final",
            END
        );

// ======================================================
// COMPILE
// ======================================================

const chatGraph =
    graph.compile();

export default chatGraph;