import {
    HumanMessage,
    AIMessage,
    SystemMessage,
} from "@langchain/core/messages";
import chatGraph from "../graph/chat.graph.js";
import { getMemories } from "../services/memory.service.js";
import memoryExtractor from "../services/memory-extractor.service.js";
import { saveExtractedMemories } from "../services/memory-persistence.service.js";

// Convert plain { role, content } objects → LangChain BaseMessage instances.
// ToolNode strictly requires BaseMessage instances and will throw on plain objects.
const toBaseMessages = (history) =>
    history.map((msg) => {
        switch (msg.role) {
            case "assistant":
                return new AIMessage(msg.content);
            case "system":
                return new SystemMessage(msg.content);
            default:
                return new HumanMessage(msg.content);
        }
    });

export const runAgent = async (req, res) => {
    try {
        const { message, history = [], userId, mode = "auto" } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
                 
            });
        }

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message is required",
            });
        }

        const memories = await getMemories(userId);
        const memoryContext = memories
            .map((memory) => `${memory.key}: ${memory.value}`)
            .join("\n");

        const result = await chatGraph.invoke({
            messages: toBaseMessages(history),
            memoryContext,
            userId,
            mode,
        });

        try {
            const extractedMemories = await memoryExtractor(history);
            await saveExtractedMemories({ userId, memories: extractedMemories });
            console.log("Memories extracted and saved:", extractedMemories.length);
        } catch (error) {
            console.error("Memory extraction failed:", error.message);
        }

        const lastMessage = result.messages[result.messages.length - 1];

        return res.status(200).json({
            success: true,
            route: result.nextAgent || result.route,
            response: result.finalResponse || lastMessage?.content || "",
        });
    } catch (error) {
        console.error("Agent error:", error);
        return res.status(500).json({
            success: false,
            message: "AI agent failed",
            error: error.message,
        });
    }
};

export const streamAgent = async (req, res) => {
    try {
        const { history = [], userId, mode = "auto" } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        if (!history.length) {
            return res.status(400).json({
                success: false,
                message: "Conversation history is required",
            });
        }

        const memories = await getMemories(userId);
        const memoryContext = memories
            .map((memory) => `${memory.key}: ${memory.value}`)
            .join("\n");

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        const stream = await chatGraph.stream(
            {
                messages: toBaseMessages(history),
                memoryContext,
                userId,
                mode,
            },
            { streamMode: "messages" }
        );

        let fullResponse = "";

        const INTERNAL_NODES = new Set([
            "supervisor",
            "router",
            "reviewAgent",
            "review",
        ]);

        for await (const [messageChunk, metadata] of stream) {
            const node = metadata?.langgraph_node;
            if (node && INTERNAL_NODES.has(node)) {
                continue;
            }

            const content = messageChunk?.content;

            if (typeof content === "string" && content.length > 0) {
                fullResponse += content;
                res.write(
                    `data: ${JSON.stringify({ type: "token", content })}\n\n`
                );
            }
        }

        // Extract memories after full response is built
        try {
            const messagesForMemory = [
                ...history,
                { role: "assistant", content: fullResponse },
            ];
            const extractedMemories = await memoryExtractor(messagesForMemory);
            await saveExtractedMemories({ userId, memories: extractedMemories });
            console.log(
                "Streaming memories extracted and saved:",
                extractedMemories.length
            );
        } catch (error) {
            console.error("Streaming memory extraction failed:", error.message);
        }

        res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
        res.end();
    } catch (error) {
        console.error("Streaming agent error:", error);

        if (!res.headersSent) {
            return res.status(500).json({
                success: false,
                message: "AI streaming failed",
            });
        }

        res.write(
            `data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`
        );
        res.end();
    }
};