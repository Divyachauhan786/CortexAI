import { useState } from "react";

const Settings = ({ user, onLogout, onNavigateToChat }) => {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState("account");

    const credits = user?.credits ?? 100;
    const maxCredits = 100;
    const creditPercentage = Math.min(100, Math.max(0, (credits / maxCredits) * 100));

    const handleCopyUserId = () => {
        const id = user?._id || user?.id || "";
        if (id) {
            navigator.clipboard.writeText(id);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const tabs = [
        { id: "account", label: "Account & Profile", icon: "👤" },
        { id: "plan", label: "Plan & Credits", icon: "⚡" },
        { id: "preferences", label: "AI & Preferences", icon: "⚙" },
    ];

    const formattedDate = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
          })
        : "Recent";

    return (
        <div className="mx-auto max-w-5xl px-6 py-8 text-white">
            {/* ==================================
                HEADER
            ================================== */}
            <div className="mb-8">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">
                    Workspace Management
                </p>
                <h2 className="text-3xl font-semibold tracking-tight">
                    Settings & Profile
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                    Manage your CortexAI account details, plan credits, and AI workspace preferences.
                </p>
            </div>

            {/* ==================================
                TABS BAR
            ================================== */}
            <div className="mb-8 flex border-b border-white/[0.06]">
                <div className="flex gap-2">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
                                    isActive
                                        ? "border-violet-500 text-white"
                                        : "border-transparent text-slate-500 hover:text-slate-300"
                                }`}
                            >
                                <span>{tab.icon}</span>
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ==================================
                TAB 1: ACCOUNT & PROFILE
            ================================== */}
            {activeTab === "account" && (
                <div className="space-y-6">
                    {/* Profile Card */}
                    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101118] p-6 shadow-2xl shadow-black/30">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                            {/* Avatar */}
                            <div className="relative flex shrink-0">
                                {user?.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user?.name || "User Avatar"}
                                        className="h-20 w-20 rounded-2xl border border-white/[0.1] object-cover shadow-lg"
                                    />
                                ) : (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-2xl font-bold text-white shadow-lg shadow-purple-500/20">
                                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                                    </div>
                                )}
                                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500 text-[10px] text-black font-bold shadow">
                                    ✓
                                </span>
                            </div>

                            {/* Info */}
                            <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-xl font-semibold text-white">
                                        {user?.name || "User"}
                                    </h3>
                                    <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-violet-300">
                                        Free Plan
                                    </span>
                                </div>
                                <p className="text-sm text-slate-400">{user?.email || "No email available"}</p>
                                <p className="text-xs text-slate-600">
                                    Member since {formattedDate} • Connected via {user?.firebaseUid ? "Google Auth" : "Email & Password"}
                                </p>
                            </div>
                        </div>

                        {/* Details grid */}
                        <div className="mt-8 grid grid-cols-1 gap-4 border-t border-white/[0.05] pt-6 sm:grid-cols-2">
                            <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                    Display Name
                                </span>
                                <p className="mt-1 text-sm font-medium text-slate-200">
                                    {user?.name || "User"}
                                </p>
                            </div>

                            <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                    Email Address
                                </span>
                                <p className="mt-1 text-sm font-medium text-slate-200">
                                    {user?.email || "—"}
                                </p>
                            </div>

                            <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                        User ID
                                    </span>
                                    <button
                                        onClick={handleCopyUserId}
                                        className="text-[11px] font-medium text-violet-400 hover:text-violet-300"
                                    >
                                        {copied ? "Copied!" : "Copy"}
                                    </button>
                                </div>
                                <p className="mt-1 truncate font-mono text-xs text-slate-300">
                                    {user?._id || user?.id || "—"}
                                </p>
                            </div>

                            <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                    Authentication Method
                                </span>
                                <p className="mt-1 text-sm font-medium text-emerald-400">
                                    {user?.firebaseUid ? "Google OAuth (Verified)" : "Standard Credentials"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Action Navigation */}
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-[#101118] p-5">
                        <div>
                            <h4 className="text-sm font-semibold text-slate-200">
                                Ready to start building?
                            </h4>
                            <p className="text-xs text-slate-500">
                                Jump directly into the AI Workspace chat or query documents.
                            </p>
                        </div>
                        <button
                            onClick={onNavigateToChat}
                            className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-600/20 transition hover:from-violet-500 hover:to-purple-500"
                        >
                            Open Chat Workspace →
                        </button>
                    </div>

                    {/* Account Logout */}
                    <div className="rounded-2xl border border-red-500/10 bg-red-500/[0.02] p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h4 className="text-sm font-semibold text-red-300">
                                    Sign Out
                                </h4>
                                <p className="text-xs text-slate-500">
                                    Safely end your current CortexAI session on this device.
                                </p>
                            </div>
                            <button
                                onClick={onLogout}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 hover:text-red-300"
                            >
                                <span>↪</span>
                                Logout from CortexAI
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================================
                TAB 2: PLAN & CREDITS
            ================================== */}
            {activeTab === "plan" && (
                <div className="space-y-6">
                    {/* Credits Meter Card */}
                    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101118] p-6 shadow-2xl shadow-black/30">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-violet-400">
                                    Workspace Credits
                                </span>
                                <h3 className="mt-1 text-2xl font-bold text-white">
                                    {credits} <span className="text-sm font-normal text-slate-500">/ 100 Credits</span>
                                </h3>
                            </div>
                            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                                Active Free Tier
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-6 space-y-2">
                            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-500"
                                    style={{ width: `${creditPercentage}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-500">
                                <span>{credits} available</span>
                                <span>Refreshes periodically</span>
                            </div>
                        </div>

                        {/* Credit Consumption Breakdown */}
                        <div className="mt-8 border-t border-white/[0.05] pt-6">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Credit Consumption Rates
                            </h4>
                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
                                    <p className="text-xs font-medium text-slate-200">Chat Agent</p>
                                    <p className="mt-0.5 text-lg font-semibold text-violet-400">1 Credit</p>
                                    <p className="text-[10px] text-slate-500">per response</p>
                                </div>
                                <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
                                    <p className="text-xs font-medium text-slate-200">Coding / Search</p>
                                    <p className="mt-0.5 text-lg font-semibold text-violet-400">1 Credit</p>
                                    <p className="text-[10px] text-slate-500">per execution</p>
                                </div>
                                <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
                                    <p className="text-xs font-medium text-slate-200">Document RAG</p>
                                    <p className="mt-0.5 text-lg font-semibold text-violet-400">1 Credit</p>
                                    <p className="text-[10px] text-slate-500">per document query</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Plan Comparison Cards */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Free Tier (Current) */}
                        <div className="relative rounded-2xl border border-violet-500/30 bg-gradient-to-b from-violet-500/[0.05] to-transparent p-6 shadow-xl">
                            <div className="flex items-center justify-between">
                                <h4 className="text-lg font-semibold text-white">Free Plan</h4>
                                <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-[10px] font-bold text-violet-300">
                                    Current Plan
                                </span>
                            </div>
                            <p className="mt-2 text-2xl font-bold text-white">
                                $0 <span className="text-xs font-normal text-slate-500">/ month</span>
                            </p>
                            <ul className="mt-5 space-y-2.5 text-xs text-slate-400">
                                <li className="flex items-center gap-2">
                                    <span className="text-emerald-400">✓</span> 100 Starter Credits
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-emerald-400">✓</span> Multi-Agent Supervisor Routing
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-emerald-400">✓</span> Tavily Web Search & Research
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-emerald-400">✓</span> Qdrant Document Intelligence (RAG)
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-emerald-400">✓</span> Long-Term Memory System
                                </li>
                            </ul>
                        </div>

                        {/* Pro Tier (Coming Soon) */}
                        <div className="relative rounded-2xl border border-white/[0.06] bg-[#101118] p-6 opacity-75">
                            <div className="flex items-center justify-between">
                                <h4 className="text-lg font-semibold text-slate-300">Pro Plan</h4>
                                <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-bold text-slate-400">
                                    Coming Soon
                                </span>
                            </div>
                            <p className="mt-2 text-2xl font-bold text-slate-300">
                                $19 <span className="text-xs font-normal text-slate-500">/ month</span>
                            </p>
                            <ul className="mt-5 space-y-2.5 text-xs text-slate-500">
                                <li className="flex items-center gap-2">
                                    <span className="text-violet-400">✦</span> Unlimited AI agent workflows
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-violet-400">✦</span> Priority model response times
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-violet-400">✦</span> Image & PPT Generation agents
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-violet-400">✦</span> High-volume vector document storage
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-violet-400">✦</span> Dedicated API keys
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================================
                TAB 3: AI & PREFERENCES
            ================================== */}
            {activeTab === "preferences" && (
                <div className="space-y-6">
                    <div className="rounded-2xl border border-white/[0.08] bg-[#101118] p-6 shadow-2xl shadow-black/30">
                        <h3 className="text-base font-semibold text-white">
                            Active Architecture & Pipeline
                        </h3>
                        <p className="text-xs text-slate-500">
                            CortexAI runtime configuration and connected microservices.
                        </p>

                        <div className="mt-6 divide-y divide-white/[0.04]">
                            <div className="flex items-center justify-between py-3.5">
                                <div>
                                    <p className="text-xs font-medium text-slate-200">LLM Inference Provider</p>
                                    <p className="text-[11px] text-slate-500">High-performance Groq Cloud</p>
                                </div>
                                <span className="rounded-lg bg-white/[0.04] px-2.5 py-1 text-xs font-mono text-violet-300">
                                    openai/gpt-oss-20b
                                </span>
                            </div>

                            <div className="flex items-center justify-between py-3.5">
                                <div>
                                    <p className="text-xs font-medium text-slate-200">Orchestration Framework</p>
                                    <p className="text-[11px] text-slate-500">Stateful multi-agent supervisor</p>
                                </div>
                                <span className="rounded-lg bg-white/[0.04] px-2.5 py-1 text-xs font-mono text-slate-300">
                                    LangGraph.js StateGraph
                                </span>
                            </div>

                            <div className="flex items-center justify-between py-3.5">
                                <div>
                                    <p className="text-xs font-medium text-slate-200">Vector Storage Engine</p>
                                    <p className="text-[11px] text-slate-500">Isolated 3072-dim embeddings</p>
                                </div>
                                <span className="rounded-lg bg-white/[0.04] px-2.5 py-1 text-xs font-mono text-emerald-400">
                                    Qdrant (Local / Cloud)
                                </span>
                            </div>

                            <div className="flex items-center justify-between py-3.5">
                                <div>
                                    <p className="text-xs font-medium text-slate-200">Semantic Long-Term Memory</p>
                                    <p className="text-[11px] text-slate-500">Auto-extracted user preferences</p>
                                </div>
                                <span className="rounded-lg bg-white/[0.04] px-2.5 py-1 text-xs font-mono text-violet-300">
                                    MongoDB Atlas
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
