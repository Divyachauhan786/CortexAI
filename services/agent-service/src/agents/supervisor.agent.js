import { z } from "zod";
import llm from "../config/llm.js";

const SupervisorDecision = z.object({
    nextAgent: z.enum([
        "CHAT",
        "RESEARCH",
        "CODING",
        "RAG",
        "PLANNING",
        "REVIEW",
        "FINAL",
    ]),

    reason: z.string(),

    needsMoreWork: z.boolean(),
});

const supervisorModel =
    llm.withStructuredOutput(
        SupervisorDecision
    );

export const supervisorAgent = async (state) => {
    const messages =
        state.messages || [];

    const lastMessage =
        messages[messages.length - 1];

    const task =
        state.task ||
        lastMessage?.content ||
        "";

    const agentHistory =
        state.agentHistory || [];

    const previousAgents =
        agentHistory
            .filter(
                (item) =>
                    item.agent &&
                    item.agent !==
                        "SUPERVISOR"
            )
            .map(
                (item) =>
                    item.agent
            );

    const lastAgent =
        previousAgents[
            previousAgents.length - 1
        ] || "NONE";

    // If an agent has already produced a result,
    // don't repeatedly execute the same agent.
    if (lastAgent === "CHAT") {
        return {
            nextAgent: "FINAL",
            reason:
                "CHAT has completed the conversation.",
            needsMoreWork: false,
        };
    }

    // Coding tasks normally need only CODING,
    // followed by a final response.
    if (
        lastAgent === "CODING" &&
        !previousAgents.includes("REVIEW")
    ) {
        return {
            nextAgent: "FINAL",
            reason:
                "The coding agent has produced the requested solution.",
            needsMoreWork: false,
        };
    }

    // RAG tasks normally finish after retrieval.
    if (
        lastAgent === "RAG" &&
        !previousAgents.includes("REVIEW")
    ) {
        return {
            nextAgent: "FINAL",
            reason:
                "The RAG agent has produced the document-based answer.",
            needsMoreWork: false,
        };
    }

    // Research tasks normally finish after web search.
    if (
        lastAgent === "RESEARCH" &&
        !previousAgents.includes("REVIEW")
    ) {
        return {
            nextAgent: "FINAL",
            reason:
                "The research agent has produced the requested information.",
            needsMoreWork: false,
        };
    }

    const response =
        await supervisorModel.invoke([
            {
                role: "system",

                content: `
You are the Supervisor of a multi-agent AI system.

Choose ONE next agent.

CHAT:
General conversation and simple questions.

RESEARCH:
Current information, latest information,
news, external web information.

CODING:
Programming, debugging, algorithms,
software engineering and code generation.

RAG:
Questions requiring the user's uploaded documents.

PLANNING:
Complex multi-step tasks requiring a plan.

REVIEW:
Only use when an intermediate result genuinely
needs validation.

FINAL:
Use when the task is complete.

Rules:
- Do not repeat the same agent unnecessarily.
- Use the simplest capable agent.
- Simple tasks should finish quickly.
- Do not expose hidden reasoning.

Previously used:
${previousAgents.join(", ") || "NONE"}

Last agent:
${lastAgent}

Task:
${task}
`,
            },
        ]);

    return response;
};