import llm from "../config/llm.js";

const memoryExtractor = async (messages) => {
    const conversation = messages
        .map((message) => {
            return `${message.role}: ${message.content}`;
        })
        .join("\n");

    const response = await llm.invoke([
        {
            role: "system",
            content: `
You are a memory extraction system.

Your job is to identify useful long-term information about the user
from a conversation.

Only extract information that is likely to remain useful in future
conversations.

Good examples:
- User's preferred programming language
- User's preferred explanation style
- User's career goal
- User's learning preference
- User's technical interests
- User's recurring project or work preference

Do NOT extract:
- Temporary questions
- One-time calculations
- General facts
- Sensitive personal information
- Passwords, API keys, tokens, or credentials
- Information about other people

Return ONLY valid JSON.

The JSON must have exactly this structure:

{
    "memories": [
        {
            "key": "short_memory_key",
            "value": "memory value",
            "importance": 0.8
        }
    ]
}

If there is nothing worth remembering, return:

{
    "memories": []
}

Importance must be a number between 0 and 1.
        `,
        },
        {
            role: "user",
            content: `
Conversation:

${conversation}

Extract only useful long-term memories about the user.
            `,
        },
    ]);

    const content = response.content.trim();

try {
    const parsed = JSON.parse(content);

    return parsed.memories || [];
} catch (error) {
    console.error(
        "Failed to parse memory extraction:",
        error.message
    );

    return [];
}
};

export default memoryExtractor;