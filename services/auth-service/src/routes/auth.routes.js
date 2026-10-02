import express from "express";

import {
    register,
    login,
    googleLogin,
    logout,
} from "../controllers/auth.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================

router.post("/register", register);

router.post("/login", login);

router.post("/google", googleLogin);

router.post("/logout", logout);

// ==========================================
// PROTECTED ROUTES
// ==========================================

router.get(
    "/me",
    authMiddleware,
    (req, res) => {
        res.status(200).json({
            success: true,
            user: req.user,
        });
    }
);

export default router;