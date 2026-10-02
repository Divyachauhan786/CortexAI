import {
    retrieveRelevantChunks,
} from "../services/retrieval.service.js";

export const searchDocuments = async (
    req,
    res
) => {
    try {
        const {
            userId,
            query,
            limit,
        } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message:
                    "userId is required",
            });
        }

        if (!query || !query.trim()) {
            return res.status(400).json({
                success: false,
                message:
                    "query is required",
            });
        }

        const results =
            await retrieveRelevantChunks({
                userId,
                query,
                limit:
                    Number(limit) || 5,
            });

        return res.json({
            success: true,

            query,

            results,
        });
    } catch (error) {
        console.error(
            "Document retrieval error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to retrieve documents",
            error:
                error.message,
        });
    }
};