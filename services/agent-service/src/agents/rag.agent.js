import llm from "../config/llm.js";
import { retrieveRelevantChunks } from "../services/retrieval.service.js";

export const ragAgent = async (state) => {
    const lastMessage =
        state.messages[state.messages.length - 1];

    const question = lastMessage?.content || "";

    if (!state.userId) {
        throw new Error("userId is required for RAG");
    }

    const documents = await retrieveRelevantChunks({
        userId: state.userId,
        query: question,
    });

    const context = documents
        .map((doc, index) => {
            return `
SOURCE ${index + 1}

${doc.text || doc.pageContent || ""}
            `;
        })
        .join("\n");

    const response = await llm.invoke([
        {
            role: "system",
            content: `
You are a document question-answering assistant.

Answer the user's question using ONLY the provided document context.

If the answer cannot be found in the provided context,
say:

"I don't know from the uploaded documents."

Do not invent information.

DOCUMENT CONTEXT:

${context || "No relevant document content found."}
            `,
        },

        {
            role: "user",
            content: question,
        },
    ]);

    return {
        messages: [response],
        retrievalContext: context,
    };
};