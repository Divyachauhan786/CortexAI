import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import {
    GoogleAuthProvider,
    signInWithPopup,
} from "firebase/auth";

import { firebaseAuth } from "../firebase";
import api from "../services/api";

import {
    loginUser,
    getCurrentUser,
} from "../store/authSlice";

const Login = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { loading, error } = useSelector(
        (state) => state.auth
    );

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [googleLoading, setGoogleLoading] = useState(false);
    const [googleError, setGoogleError] = useState("");

    // ==========================================
    // NORMAL EMAIL/PASSWORD LOGIN
    // ==========================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        const result = await dispatch(
            loginUser({
                email,
                password,
            })
        );

        if (loginUser.fulfilled.match(result)) {
            navigate("/");
        }
    };

    // ==========================================
    // GOOGLE LOGIN
    // ==========================================

    const handleGoogleLogin = async () => {
        try {
            setGoogleLoading(true);
            setGoogleError("");

            const provider = new GoogleAuthProvider();

            provider.setCustomParameters({
                prompt: "select_account",
            });

            // Open Google login popup
            const result = await signInWithPopup(
                firebaseAuth,
                provider
            );

            // Get Firebase ID token
            const idToken =
                await result.user.getIdToken();

            // Send Firebase token to our backend
            await api.post(
                "/auth/google",
                {
                    idToken,
                }
            );

            // Get user from our existing Redis session
            const currentUserResult =
                await dispatch(getCurrentUser());

            if (
                getCurrentUser.fulfilled.match(
                    currentUserResult
                )
            ) {
                navigate("/");
            } else {
                throw new Error(
                    "Unable to load authenticated user"
                );
            }

        } catch (error) {
            console.error(
                "Google login error:",
                error
            );

            setGoogleError(
                error.response?.data?.message ||
                error.message ||
                "Google login failed"
            );

        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center px-4">

            <div className="w-full max-w-md">

                {/* Logo / Brand */}

                <div className="text-center mb-8">

                    <div className="flex justify-center mb-5">

                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-500/20">

                            <span className="text-xl font-bold">
                                C
                            </span>

                        </div>

                    </div>

                    <h1 className="text-3xl font-semibold tracking-tight">
                        Welcome to CortexAI
                    </h1>

                    <p className="mt-2 text-sm text-zinc-400">
                        Please login to continue using the app.
                    </p>

                </div>

                {/* Card */}

                <div className="rounded-2xl border border-white/10 bg-[#111111] p-7 shadow-2xl">

                    {/* Google Button */}

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={
                            loading ||
                            googleLoading
                        }
                        className="w-full h-12 rounded-xl bg-white text-black font-medium flex items-center justify-center gap-3 hover:bg-zinc-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >

                        {googleLoading ? (
                            <>
                                <div className="h-5 w-5 border-2 border-zinc-400 border-t-black rounded-full animate-spin" />

                                <span>
                                    Connecting...
                                </span>
                            </>
                        ) : (
                            <>
                                {/* Google G */}

                                <span className="text-lg font-bold">
                                    G
                                </span>

                                <span>
                                    Continue with Google
                                </span>
                            </>
                        )}

                    </button>

                    {/* Google Error */}

                    {googleError && (
                        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                            {googleError}
                        </div>
                    )}

                    {/* Divider */}

                    <div className="flex items-center gap-4 my-6">

                        <div className="h-px flex-1 bg-white/10" />

                        <span className="text-xs text-zinc-500">
                            OR
                        </span>

                        <div className="h-px flex-1 bg-white/10" />

                    </div>

                    {/* Email */}

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-4"
                    >

                        <div>

                            <label className="block text-sm text-zinc-300 mb-2">
                                Email
                            </label>

                            <input
                                type="email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                placeholder="you@example.com"
                                required
                                className="w-full h-12 rounded-xl border border-white/10 bg-[#0b0b0b] px-4 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-purple-500/60 transition"
                            />

                        </div>

                        {/* Password */}

                        <div>

                            <label className="block text-sm text-zinc-300 mb-2">
                                Password
                            </label>

                            <input
                                type="password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                placeholder="••••••••"
                                required
                                className="w-full h-12 rounded-xl border border-white/10 bg-[#0b0b0b] px-4 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-purple-500/60 transition"
                            />

                        </div>

                        {/* Backend error */}

                        {error && (
                            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                                {error}
                            </div>
                        )}

                        {/* Login */}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-medium hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >

                            {loading
                                ? "Signing in..."
                                : "Login"}

                        </button>

                    </form>

                    {/* Register */}

                    <p className="text-center text-sm text-zinc-500 mt-6">

                        Don't have an account?{" "}

                        <Link
                            to="/register"
                            className="text-purple-400 hover:text-purple-300 transition"
                        >
                            Create account
                        </Link>

                    </p>

                </div>

                {/* Footer */}

                <p className="text-center text-xs text-zinc-600 mt-6">
                    Secure authentication powered by Firebase
                </p>

            </div>

        </div>
    );
};

export default Login;