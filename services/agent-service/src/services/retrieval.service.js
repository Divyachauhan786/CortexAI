import qdrant from "../config/qdrant.js";

import embeddings from "../config/embeddings.js";

const COLLECTION_NAME =
    process.env.QDRANT_COLLECTION;

export const retrieveRelevantChunks = async ({
    userId,
    query,
    limit = 5,
}) => {
    if (!userId) {
        throw new Error(
            "userId is required"
        );
    }

    if (!query || !query.trim()) {
        throw new Error(
            "Query is required"
        );
    }

    console.log(`[Retrieval] Embedding query for userId=${userId}`);
    // Convert the user's question
    // into the same embedding space
    // used for document chunks.
    const queryVector =
        await embeddings.embedQuery(
            query.trim()
        );

    console.log(`[Retrieval] Querying Qdrant collection="${COLLECTION_NAME}" with limit=${limit}`);
    const result = await qdrant.query(
        COLLECTION_NAME,
        {
            query: queryVector,

            limit,

            filter: {
                must: [
                    {
                        key: "userId",
                        match: {
                            value:
                                userId.toString(),
                        },
                    },
                ],
            },

            with_payload: true,

            with_vector: false,
        }
    );

    console.log(`[Retrieval] Found ${result.points.length} matching chunks in Qdrant.`);

    return result.points.map(
        (point) => ({
            score: point.score,

            documentId:
                point.payload?.documentId,

            documentName:
                point.payload?.documentName,

            chunkIndex:
                point.payload?.chunkIndex,

            text:
                point.payload?.text,
        })
    );
};