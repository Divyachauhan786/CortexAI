import { z } from "zod";

const messageSchema = z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string().max(10000),
});

const agentRequestSchema = z.object({
    message: z
        .string()
        .trim()
        .min(1, "Message cannot be empty")
        .max(10000, "Message is too long"),

    userId: z
        .string()
        .trim()
        .min(1, "userId is required"),

    history: z
        .array(messageSchema)
        .max(50, "Conversation history is too large")
        .default([]),
});

export const validateAgentRequest = (req, res, next) => {
    const result = agentRequestSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: "Invalid agent request",
            errors: result.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        });
    }

    req.body = result.data;

    next();
};