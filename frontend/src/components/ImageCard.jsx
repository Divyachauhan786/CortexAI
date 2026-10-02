import { useState } from "react";

const ImageCard = ({ imageUrl, prompt, createdAt }) => {
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const handleCopyPrompt = () => {
        if (prompt) {
            navigator.clipboard.writeText(prompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownload = async () => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = `cortexai-image-${Date.now()}.jpg`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            // Fallback: open in new tab
            window.open(imageUrl, "_blank");
        }
    };

    return (
        <div className="mt-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101118] p-4 shadow-2xl shadow-black/40">
            {/* Header Status */}
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-500/20 text-xs text-violet-300">
                        ✦
                    </span>
                    <span className="text-xs font-semibold text-violet-300">
                        Image Generated Successfully
                    </span>
                </div>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
                    Ready • 1024x1024 HD
                </span>
            </div>

            {/* Prompt */}
            {prompt && (
                <div className="mb-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-2.5 text-xs text-slate-300">
                    <span className="font-semibold text-slate-400">Prompt: </span>
                    <span className="italic">"{prompt}"</span>
                </div>
            )}

            {/* Image Box */}
            <div className="group relative overflow-hidden rounded-xl bg-black/40">
                {loading && (
                    <div className="flex aspect-square w-full max-w-lg items-center justify-center bg-white/[0.02] text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                            <span className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                            <span className="text-xs">Rendering high-res image...</span>
                        </div>
                    </div>
                )}
                <img
                    src={imageUrl}
                    alt={prompt || "AI Generated"}
                    onLoad={() => setLoading(false)}
                    onClick={() => setShowModal(true)}
                    className={`max-h-[480px] w-full cursor-zoom-in rounded-xl object-contain transition duration-300 ${
                        loading ? "hidden" : "block group-hover:scale-[1.01]"
                    }`}
                />
            </div>

            {/* Action Bar */}
            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.04] pt-3">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleDownload}
                        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/20 transition hover:from-violet-500 hover:to-purple-500"
                    >
                        <span>↓</span>
                        Download Image
                    </button>
                    <button
                        type="button"
                        onClick={handleCopyPrompt}
                        className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                    >
                        <span>{copied ? "✓" : "📋"}</span>
                        <span>{copied ? "Copied" : "Copy Prompt"}</span>
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="text-[11px] text-slate-500 transition hover:text-slate-300"
                >
                    View Fullscreen ↗
                </button>
            </div>

            {/* Modal Zoom */}
            {showModal && (
                <div
                    onClick={() => setShowModal(false)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
                >
                    <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl border border-white/[0.1] bg-[#101118] p-2 shadow-2xl">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black"
                        >
                            ✕
                        </button>
                        <img
                            src={imageUrl}
                            alt={prompt || "Full size preview"}
                            className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageCard;
