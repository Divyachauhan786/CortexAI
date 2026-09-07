import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true,
        },

        title: {
            type: String,
            default: "New Chat",
            trim: true,
        },

        lastMessage: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

const Chat = mongoose.model(
    "Chat",
    chatSchema
);

export default Chat;