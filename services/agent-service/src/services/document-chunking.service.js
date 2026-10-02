import {
    RecursiveCharacterTextSplitter,
} from "@langchain/textsplitters";

const textSplitter =
    new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });

export const chunkDocument = async (text) => {
    if (!text || !text.trim()) {
        return [];
    }

    const chunks =
        await textSplitter.splitText(text);

    return chunks.map((content, index) => ({
        index,
        content,
    }));
};