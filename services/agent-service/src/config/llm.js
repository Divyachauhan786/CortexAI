import "dotenv/config";
import { ChatGroq } from "@langchain/groq";

const llm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
    temperature: 0.2,
    maxTokens: 1000,
});

export default llm;