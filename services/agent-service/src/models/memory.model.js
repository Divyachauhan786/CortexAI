import mongoose from "mongoose";

const memorySchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },

        key: {
            type: String,
            required: true,
            trim: true,
        },

        value: {
            type: String,
            required: true,
            trim: true,
        },

        source: {
            type: String,
            enum: ["conversation", "explicit"],
            default: "conversation",
        },

        importance: {
            type: Number,
            min: 0,
            max: 1,
            default: 0.5,
        },

        lastAccessedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

memorySchema.index(
    {
        userId: 1,
        key: 1,
    },
    {
        unique: true,
    }
);

const Memory = mongoose.model("Memory", memorySchema);

export default Memory;