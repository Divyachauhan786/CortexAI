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
        const { content } = req.body;

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

        // 1. Save USER message


        const userMessage = await Message.create({
            chatId,
            userId,
            role: "user",
            content: content.trim(),
        });

        chat.lastMessage = content.trim();
        await chat.save();

  
        // 2. Call Agent Service
    

        const agentResponse = await fetch(
            `${process.env.AGENT_SERVICE}/agent/run`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                },

                body: JSON.stringify({
                    message: content.trim(),
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

   // 3. Save ASSISTANT message

        const assistantMessage = await Message.create({
            chatId,
            userId,
            role: "assistant",
            content: agentData.response,
        });

        chat.lastMessage = agentData.response;
        await chat.save();

        // 4. Return both messages


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
