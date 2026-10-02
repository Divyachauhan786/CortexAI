import crypto from "crypto";
import qdrant from "../config/qdrant.js";

const COLLECTION_NAME =
    process.env.QDRANT_COLLECTION;

// Must match the output dimension of the configured embedding model.
// gemini-embedding-001 → 3072 dimensions.
const VECTOR_SIZE = 3072;

export const initializeCollection = async () => {
    const collections =
        await qdrant.getCollections();

    const exists =
        collections.collections.some(
            (collection) =>
                collection.name ===
                COLLECTION_NAME
        );

    if (exists) {
        console.log(
            `[Qdrant] Collection "${COLLECTION_NAME}" already exists — reusing.`
        );
        return;
    }

    await qdrant.createCollection(
        COLLECTION_NAME,
        {
            vectors: {
                size: VECTOR_SIZE,
                distance: "Cosine",
            },
        }
    );

    console.log(
        `[Qdrant] Collection "${COLLECTION_NAME}" created (size=${VECTOR_SIZE}, distance=Cosine).`
    );
};

export const storeDocumentChunks = async ({
    userId,
    documentId,
    documentName,
    chunks,
}) => {
    if (!userId) {
        throw new Error("userId is required");
    }

    if (!documentId) {
        throw new Error("documentId is required");
    }

    if (
        !Array.isArray(chunks) ||
        chunks.length === 0
    ) {
        throw new Error("Chunks are required");
    }

    console.log(
        `[Qdrant] Storing ${chunks.length} chunk(s) for documentId=${documentId}, userId=${userId}`
    );

    // Qdrant requires point IDs to be either unsigned 64-bit integers
    // or UUID strings (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).
    // crypto.randomUUID() produces a standards-compliant UUID v4.
    const points = chunks.map((chunk) => ({
        id: crypto.randomUUID(),

        vector: chunk.embedding,

        payload: {
            userId: userId.toString(),
            documentId: documentId.toString(),
            documentName,
            chunkIndex: chunk.index,
            text: chunk.content,
        },
    }));

    await qdrant.upsert(COLLECTION_NAME, {
        wait: true,
        points,
    });

    console.log(
        `[Qdrant] Successfully stored ${points.length} vector(s) for document "${documentName}".`
    );

    return {
        storedChunks: points.length,
    };
};