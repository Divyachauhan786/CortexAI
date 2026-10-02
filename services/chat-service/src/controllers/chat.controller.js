import mongoose from "mongoose";
import Chat from "../models/chat.model.js";
import Message from "../models/message.model.js";

// CREATE CHAT

export const createChat = async (req, res) => {
    try {
        const userId = req.user._id;

        const chat = await Chat.create({
            userId,
            title: "New Chat",
        });

        return res.status(201).json({
            success: true,
            chat,
        });

    } catch (error) {
        console.error(
            "Create chat error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Failed to create chat",
        });
    }
};

// GET USER CHATS

export const getChats = async (req, res) => {
    try {
        const userId = req.user._id;

        const chats = await Chat.find({
            userId,
        }).sort({
            updatedAt: -1,
        });

        return res.status(200).json({
            success: true,
            chats,
        });

    } catch (error) {
        console.error(
            "Get chats error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch chats",
        });
    }
};

// GET CHAT MESSAGES

export const getMessages = async (req, res) => {
    try {
        const userId = req.user._id;

        const { chatId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(chatId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid chat ID format",
            });
        }

        const chat = await Chat.findOne({
            _id: chatId,
            userId,
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "Chat not found",
            });
        }

        const messages = await Message.find({
            chatId,
            userId,
        }).sort({
            createdAt: 1,
        });

        return res.status(200).json({
            success: true,
            chat,
            messages,
        });

    } catch (error) {
        console.error(
            "Get messages error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch messages",
        });
    }
};

// SEND USER MESSAGE
export const sendMessage = async (req, res) => {
    try {
        const userId = req.user._id;
        const { chatId } = req.params;
        const { content, mode } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message content is required",
            });
        }

        const chat = await Chat.findOne({
            _id: chatId,
            userId,
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "Chat not found",
            });
        }

        // 1. Get conversation history before adding current message
        const conversationHistory = await Message.find({
            chatId,
            userId,
        })
            .sort({ createdAt: 1 })
            .select("role content -_id")
            .lean();

        // 2. Save USER message
        const userMessage = await Message.create({
            chatId,
            userId,
            role: "user",
            content: content.trim(),
        });

        chat.lastMessage = content.trim();
        await chat.save();

        // 3. Call Agent Service
        const agentResponse = await fetch(
            `${process.env.AGENT_SERVICE}/agent/run`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: content.trim(),
                    history: conversationHistory,
                    userId: req.user._id.toString(),
                    mode: mode || "auto",
                }),
            }
        );

        if (!agentResponse.ok) {
            console.error(
                "Agent Service returned:",
                agentResponse.status
            );

            return res.status(502).json({
                success: false,
                message: "AI Agent Service unavailable",
                userMessage,
            });
        }

        const agentData = await agentResponse.json();

        // 4. Save ASSISTANT message
        const assistantMessage = await Message.create({
            chatId,
            userId,
            role: "assistant",
            content: agentData.response,
        });

        chat.lastMessage = agentData.response;
        await chat.save();

        // 5. Return both messages
        return res.status(201).json({
            success: true,
            userMessage,
            assistantMessage,
            agent: {
                route: agentData.route,
            },
        });
    } catch (error) {
        console.error(
            "Send message error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Failed to process message",
        });
    }
};
// ======================================================
// STREAM AI RESPONSE
// ======================================================

export const streamMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { content, mode } = req.body;

        // --------------------------------------------------
        // 1. Validate input
        // --------------------------------------------------

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message content is required",
            });
        }

        // --------------------------------------------------
        // 2. Check chat belongs to logged-in user
        // --------------------------------------------------

        const chat = await Chat.findOne({
            _id: chatId,
            userId: req.user._id,
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "Chat not found",
            });
        }

        // --------------------------------------------------
        // 3. Save user message
        // --------------------------------------------------

        await Message.create({
            chatId,
            userId: req.user._id,
            role: "user",
            content: content.trim(),
        });

        // Update last message
        chat.lastMessage = content.trim();
        await chat.save();

        // --------------------------------------------------
        // 4. Get complete conversation history
        // --------------------------------------------------

        const messages = await Message.find({
            chatId,
            userId: req.user._id,
        })
            .sort({ createdAt: 1 })
            .select("role content -_id");

        const conversationHistory = messages.map((message) => ({
            role: message.role,
            content: message.content,
        }));

        // --------------------------------------------------
        // 5. Call Agent Service
        // --------------------------------------------------

        const agentResponse = await fetch(
            `${process.env.AGENT_SERVICE}/agent/stream`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: content.trim(),
                    history: conversationHistory,
                    userId: req.user._id.toString(),
                    mode: mode || "auto",
                }),
            }
        );

        if (!agentResponse.ok) {
            const errorText = await agentResponse.text();

            console.error("Agent streaming error:", errorText);

            return res.status(500).json({
                success: false,
                message: "Agent Service streaming failed",
            });
        }

        // --------------------------------------------------
        // 6. Setup SSE response
        // --------------------------------------------------

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        // --------------------------------------------------
        // 7. Read Agent Service stream
        // --------------------------------------------------

        const reader = agentResponse.body.getReader();
        const decoder = new TextDecoder();

        let buffer = "";
        let fullResponse = "";

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            buffer += decoder.decode(value, {
                stream: true,
            });

            const events = buffer.split("\n\n");

            buffer = events.pop() || "";

            for (const event of events) {
                if (!event.startsWith("data:")) {
                    continue;
                }

                const data = event
                    .replace(/^data:\s*/, "")
                    .trim();

                if (!data) {
                    continue;
                }

                let parsed;

                try {
                    parsed = JSON.parse(data);
                } catch {
                    continue;
                }

                // ------------------------------------------
                // Token
                // ------------------------------------------

                if (parsed.type === "token") {
                    fullResponse += parsed.content;

                    res.write(
                        `data: ${JSON.stringify({
                            type: "token",
                            content: parsed.content,
                        })}\n\n`
                    );
                }

                // ------------------------------------------
                // Done
                // ------------------------------------------

                if (parsed.type === "done") {
                    // Save complete assistant response
                    if (fullResponse.trim()) {
                        await Message.create({
                            chatId,
                            userId: req.user._id,
                            role: "assistant",
                            content: fullResponse,
                        });

                        chat.lastMessage = fullResponse;
                        await chat.save();
                    }

                    res.write(
                        `data: ${JSON.stringify({
                            type: "done",
                        })}\n\n`
                    );
                }

                // ------------------------------------------
                // Error
                // ------------------------------------------

                if (parsed.type === "error") {
                    res.write(
                        `data: ${JSON.stringify({
                            type: "error",
                            message: parsed.message,
                        })}\n\n`
                    );
                }
            }
        }

        res.end();
    } catch (error) {
        console.error(
            "Chat streaming error:",
            error
        );

        if (!res.headersSent) {
            return res.status(500).json({
                success: false,
                message: "Streaming failed",
            });
        }

        res.write(
            `data: ${JSON.stringify({
                type: "error",
                message: error.message,
            })}\n\n`
        );

        res.end();
    }
};