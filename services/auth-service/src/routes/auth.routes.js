import express from "express";

import {
    register,
    login,
    logout,
} from "../controllers/auth.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();


// Public routes

router.post("/register", register);

router.post("/login", login);

router.post("/logout", logout);

// Protected route

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