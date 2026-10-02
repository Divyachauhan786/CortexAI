import {
    getMemories,
    deleteMemory,
    clearMemories,
} from "../services/memory.service.js";


export const getUserMemories = async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        const memories = await getMemories(userId);

        return res.json({
            success: true,
            memories,
        });

    } catch (error) {
        console.error(
            "Get memories error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Failed to get memories",
        });
    }
};


export const removeMemory = async (req, res) => {
    try {
        const { userId } = req.query;
        const { key } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        if (!key) {
            return res.status(400).json({
                success: false,
                message: "Memory key is required",
            });
        }

        const deletedMemory =
            await deleteMemory(userId, key);

        if (!deletedMemory) {
            return res.status(404).json({
                success: false,
                message: "Memory not found",
            });
        }

        return res.json({
            success: true,
            message: "Memory deleted successfully",
        });

    } catch (error) {
        console.error(
            "Delete memory error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Failed to delete memory",
        });
    }
};


export const removeAllMemories = async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        await clearMemories(userId);

        return res.json({
            success: true,
            message: "All memories deleted successfully",
        });

    } catch (error) {
        console.error(
            "Clear memories error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Failed to clear memories",
        });
    }
};