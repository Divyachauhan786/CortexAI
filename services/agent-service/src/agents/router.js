import llm from "../config/llm.js";

export const routerAgent = async (state) => {
    const lastMessage =
        state.messages[state.messages.length - 1];

    const response = await llm.invoke([
        {
            role: "system",
            content: `
You are an AI request router.

Classify the user's request into exactly ONE category:

CHAT
SEARCH
CODING
RAG

CHAT:
General questions, explanations, conversations,
writing, casual requests.

SEARCH:
Requests asking for current information,
latest information, news, prices, weather,
web research, or information requiring
external sources.

CODING:
Programming questions, debugging, code generation,
software engineering, algorithms, or technical
implementation.

RAG:
Questions that specifically refer to information
inside the user's uploaded documents, files,
PDFs, DOCX files, resume, notes, reports,
or previously uploaded documents.

Examples of RAG:
- What projects are mentioned in my resume?
- Summarize my uploaded PDF.
- What skills are listed in my resume?
- According to the uploaded document, what is X?
- Find the experience section in my resume.
- What does the uploaded report say about X?

If the user clearly asks about an uploaded
document, choose RAG.

Return ONLY one word:

CHAT
SEARCH
CODING
or
RAG
            `,
        },
        {
            role: "user",
            content: lastMessage.content,
        },
    ]);

    return {
        route:
            response.content
                .trim()
                .toUpperCase(),
    };
};