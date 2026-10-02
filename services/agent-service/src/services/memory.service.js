import Memory from "../models/memory.model.js";

export const upsertMemory = async ({
    userId,
    key,
    value,
    source = "conversation",
    importance = 0.5,
}) => {
    const memory = await Memory.findOneAndUpdate(
        {
            userId: userId.toString(),
            key,
        },
        {
            $set: {
                value,
                source,
                importance,
                lastAccessedAt: new Date(),
            },
        },
      {
    returnDocument: "after",
    upsert: true,
    setDefaultsOnInsert: true,
}
    );

    return memory;
};


export const getMemories = async (
    userId,
    limit = 20
) => {
    const memories = await Memory.find({
        userId: userId.toString(),
    })
        .sort({
            importance: -1,
            updatedAt: -1,
        })
        .limit(limit)
        .lean();

    return memories;
};


export const deleteMemory = async (
    userId,
    key
) => {
    return Memory.findOneAndDelete({
        userId: userId.toString(),
        key,
    });
};


export const clearMemories = async (
    userId
) => {
    return Memory.deleteMany({
        userId: userId.toString(),
    });
};