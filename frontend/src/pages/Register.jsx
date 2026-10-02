import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../store/authSlice";
import { Link, useNavigate } from "react-router-dom";

const Register = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { loading, error } = useSelector((state) => state.auth);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        const result = await dispatch(
            registerUser({
                name,
                email,
                password,
            })
        );

        if (registerUser.fulfilled.match(result)) {
            navigate("/");
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">

            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-red-600/10 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-red-600/10 blur-3xl" />
            </div>

            {/* Register Card */}
            <div className="relative w-full max-w-md">

                {/* Logo / Brand */}
                <div className="text-center mb-8">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 shadow-lg shadow-red-600/20">
                        <span className="text-2xl font-bold">AI</span>
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight">
                        AI Workspace
                    </h1>

                    <p className="mt-2 text-sm text-slate-400">
                        Build, research and create with AI
                    </p>
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">

                    <div className="mb-7">
                        <h2 className="text-2xl font-semibold">
                            Create your account
                        </h2>

                        <p className="mt-1 text-sm text-slate-400">
                            Get started with your AI workspace
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Name */}
                        <div>
                            <label
                                htmlFor="name"
                                className="mb-2 block text-sm font-medium text-slate-200"
                            >
                                Full name
                            </label>

                            <input
                                id="name"
                                type="text"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                autoComplete="name"
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-2 block text-sm font-medium text-slate-200"
                            >
                                Email address
                            </label>

                            <input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                htmlFor="password"
                                className="mb-2 block text-sm font-medium text-slate-200"
                            >
                                Password
                            </label>

                            <input
                                id="password"
                                type="password"
                                placeholder="Minimum 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                autoComplete="new-password"
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                            />

                            <p className="mt-2 text-xs text-slate-500">
                                Password must contain at least 6 characters.
                            </p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-400">
                                {error}
                            </div>
                        )}

                        {/* Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/10 transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading
                                ? "Creating account..."
                                : "Create account"}
                        </button>
                    </form>

                    {/* Login */}
                    <div className="mt-7 border-t border-slate-800 pt-6 text-center">
                        <p className="text-sm text-slate-400">
                            Already have an account?{" "}
                            <Link
                                to="/login"
                                className="font-medium text-red-400 transition hover:text-red-300"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="mt-6 text-center text-xs text-slate-600">
                    AI Workspace • Secure AI Platform
                </p>
            </div>
        </div>
    );
};

export default Register;