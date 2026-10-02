import { Annotation } from "@langchain/langgraph";

export const AgentState = Annotation.Root({
    // Conversation messages
    messages: Annotation({
        reducer: (current, update) => {
            return [...current, ...update];
        },
        default: () => [],
    }),

    // Authenticated user
    userId: Annotation({
        reducer: (_, update) => update,
        default: () => "",
    }),

    // Supervisor routing
    route: Annotation({
        reducer: (_, update) => update,
        default: () => "CHAT",
    }),

    nextAgent: Annotation({
        reducer: (_, update) => update,
        default: () => "",
    }),

    // Original user task
    task: Annotation({
        reducer: (_, update) => update,
        default: () => "",
    }),

    // Workspace mode (auto, chat, coding, search, pdf)
    mode: Annotation({
        reducer: (_, update) => update,
        default: () => "auto",
    }),

    // Long-term memory
    memoryContext: Annotation({
        reducer: (_, update) => update,
        default: () => "",
    }),

    // RAG context
    retrievalContext: Annotation({
        reducer: (_, update) => update,
        default: () => "",
    }),

    // Research results
    researchContext: Annotation({
        reducer: (_, update) => update,
        default: () => "",
    }),

    // Coding results
    codeContext: Annotation({
        reducer: (_, update) => update,
        default: () => "",
    }),

    // Planning output
    plan: Annotation({
        reducer: (_, update) => update,
        default: () => "",
    }),

    // Review output
    review: Annotation({
        reducer: (_, update) => update,
        default: () => "",
    }),

    // Safe metadata about agents that have executed
    agentHistory: Annotation({
        reducer: (current, update) => {
            return [...current, ...update];
        },
        default: () => [],
    }),

    // Final response generated for the user
    finalResponse: Annotation({
        reducer: (_, update) => update,
        default: () => "",
    }),

    // Prevent infinite agent loops
    iterationCount: Annotation({
        reducer: (_, update) => update,
        default: () => 0,
    }),

    // Graph status
    status: Annotation({
        reducer: (_, update) => update,
        default: () => "running",
    }),
});