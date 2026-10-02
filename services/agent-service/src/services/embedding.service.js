import embeddings from "../config/embeddings.js";

export const generateEmbedding = async (
    text
) => {
    if (!text || !text.trim()) {
        throw new Error(
            "Text is required for embedding"
        );
    }

    const vector =
        await embeddings.embedQuery(text);

    return vector;
};

export const generateEmbeddings = async (
    chunks
) => {
    if (!Array.isArray(chunks) || !chunks.length) {
        return [];
    }

    const texts = chunks.map(
        (chunk) => chunk.content
    );

    const vectors =
        await embeddings.embedDocuments(
            texts
        );

    return chunks.map((chunk, index) => ({
        ...chunk,

        embedding: vectors[index],
    }));
};