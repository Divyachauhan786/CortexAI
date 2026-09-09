import { HumanMessage } from "@langchain/core/messages";
import chatGraph from "../graph/chat.graph.js";

export const runAgent = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message is required",
            });
        }

        const result = await chatGraph.invoke({
            messages: [new HumanMessage(message.trim())],
        });

        const lastMessage =
            result.messages[result.messages.length - 1];

        return res.status(200).json({
            success: true,
            route: result.route,
            response: lastMessage.content,
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