export const createAgentError = ({
    agent,
    error,
}) => {
    return {
        success: false,
        agent,
        error: error?.message || "Unknown agent error",
        timestamp: new Date().toISOString(),
    };
};

export const getSafeErrorMessage = (error) => {
    const message = error?.message || "";

    if (message.includes("429")) {
        return "AI service rate limit reached. Please try again shortly.";
    }

    if (
        message.toLowerCase().includes("qdrant")
    ) {
        return "Document search service is temporarily unavailable.";
    }

    if (
        message.toLowerCase().includes("tavily")
    ) {
        return "Web research service is temporarily unavailable.";
    }

    if (
        message.toLowerCase().includes("mongodb")
    ) {
        return "Database service is temporarily unavailable.";
    }

    return "The AI agent encountered an error. Please try again.";
};