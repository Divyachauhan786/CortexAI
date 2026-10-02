import express from "express";

import authMiddleware from "../middleware/auth.middleware.js";

import {
    createChat,
    getChats,
    getMessages,
    sendMessage,
    streamMessage
} from "../controllers/chat.controller.js";

const router = express.Router();


// All chat routes require authentication

router.use(authMiddleware);


// Create chat

router.post(
    "/",
    createChat
);


// Get user's chats

router.get(
    "/",
    getChats
);


// Get messages

router.get(
    "/:chatId/messages",
    getMessages
);


// Send message

router.post(
    "/:chatId/messages",
    sendMessage
);
router.post("/:chatId/stream", streamMessage);


export default router;