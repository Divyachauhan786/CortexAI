import bcrypt from "bcryptjs";

import User from "../models/user.model.js";

import {
    createSession,
    deleteSession,
} from "../services/session.service.js";

import { firebaseAdminAuth } from "../config/firebaseAdmin.js";

const isProduction = process.env.NODE_ENV === "production";

// ==========================================
// COOKIE OPTIONS
// ==========================================

// IMPORTANT: SameSite=None requires Secure (HTTPS).
// If serving over plain HTTP (even in production), use SameSite=Lax + Secure=false.
// Set COOKIE_SECURE=true and COOKIE_SAMESITE=none only when behind HTTPS.
const cookieSecure = process.env.COOKIE_SECURE === "true";
const cookieSameSite = process.env.COOKIE_SAMESITE || "lax";

const cookieOptions = {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 7,
};

// ==========================================
// REGISTER
// ==========================================

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name,
            email: normalizedEmail,
            password: hashedPassword,
        });

        const sessionId = await createSession(user._id);

        res.cookie("sessionId", sessionId, cookieOptions);

        console.log(
            "Session created for user:",
            user._id.toString()
        );

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                credits: user.credits,
            },
        });

    } catch (error) {
        console.error("Register error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// ==========================================
// LOGIN
// ==========================================

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({
            email: normalizedEmail,
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Google-only users don't have a local password.
        if (!user.password) {
            return res.status(401).json({
                success: false,
                message: "This account uses Google Sign-In",
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const sessionId = await createSession(user._id);

        res.cookie("sessionId", sessionId, cookieOptions);

        console.log(
            "Login successful. Session created:",
            user._id.toString()
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                credits: user.credits,
            },
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// ==========================================
// GOOGLE LOGIN
// ==========================================

export const googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({
                success: false,
                message: "Firebase ID token is required",
            });
        }

        // Verify Firebase ID token
        const decodedToken = await firebaseAdminAuth.verifyIdToken(
            idToken
        );

        const {
            uid,
            email,
            name,
            picture,
            email_verified,
        } = decodedToken;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Google account email is required",
            });
        }

        if (!email_verified) {
            return res.status(401).json({
                success: false,
                message: "Google email is not verified",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // First try to find the user using Firebase UID.
        let user = await User.findOne({
            firebaseUid: uid,
        });

        // If the user doesn't exist by Firebase UID,
        // check whether an existing account uses the same email.
        if (!user) {
            user = await User.findOne({
                email: normalizedEmail,
            });
        }

        // Existing user
        if (user) {
            // Link Firebase UID if this account has not been linked yet.
            if (!user.firebaseUid) {
                user.firebaseUid = uid;
            }

            // Update profile information from Google when available.
            if (name) {
                user.name = name;
            }

            if (picture) {
                user.avatar = picture;
            }

            await user.save();
        }

        // New Google user
        if (!user) {
            user = await User.create({
                name: name || normalizedEmail.split("@")[0],
                email: normalizedEmail,
                password: null,
                firebaseUid: uid,
                avatar: picture || "",
                credits: 100,
            });
        }

        // Create the same Redis session used by normal login.
        const sessionId = await createSession(user._id);

        // Store session in HTTP-only cookie.
        res.cookie("sessionId", sessionId, cookieOptions);

        console.log(
            "Google login successful. Session created:",
            user._id.toString()
        );

        return res.status(200).json({
            success: true,
            message: "Google login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                credits: user.credits,
            },
        });

    } catch (error) {
        console.error("Google login error:", error);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired Firebase ID token",
        });
    }
};

// ==========================================
// LOGOUT
// ==========================================

export const logout = async (req, res) => {
    try {
        const sessionId = req.cookies?.sessionId;

        if (sessionId) {
            await deleteSession(sessionId);
        }

        res.clearCookie("sessionId", {
            httpOnly: true,
            secure: cookieSecure,
            sameSite: cookieSameSite,
            path: "/",
        });

        return res.status(200).json({
            success: true,
            message: "Logout successful",
        });

    } catch (error) {
        console.error("Logout error:", error);

        return res.status(500).json({
            success: false,
            message: "Logout failed",
        });
    }
};