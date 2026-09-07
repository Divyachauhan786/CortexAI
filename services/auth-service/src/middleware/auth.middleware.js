import User from "../models/user.model.js";

import {
    getSession,
} from "../services/session.service.js";


const authMiddleware = async (req, res, next) => {
    try {

        const sessionId = req.cookies.sessionId;

        if (!sessionId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const session = await getSession(sessionId);

        if (!session) {
            return res.status(401).json({
                success: false,
                message: "Session expired or invalid",
            });
        }

        const user = await User.findById(
            session.userId
        ).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }

        req.user = user;

        next();

    } catch (error) {
        console.error(
            "Authentication middleware error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Authentication failed",
        });
    }
};

export default authMiddleware;