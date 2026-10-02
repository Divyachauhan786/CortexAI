import {
    upsertMemory,
} from "./memory.service.js";


export const saveExtractedMemories = async ({
    userId,
    memories,
}) => {
    if (!userId || !Array.isArray(memories)) {
        return [];
    }

    const savedMemories = [];

    for (const memory of memories) {
        if (
            !memory?.key ||
            !memory?.value
        ) {
            continue;
        }

        const savedMemory = await upsertMemory({
            userId,
            key: memory.key,
            value: memory.value,
            source: "conversation",
            importance:
                typeof memory.importance === "number"
                    ? Math.max(
                          0,
                          Math.min(
                              1,
                              memory.importance
                          )
                      )
                    : 0.5,
        });

        savedMemories.push(savedMemory);
    }

    return savedMemories;
};