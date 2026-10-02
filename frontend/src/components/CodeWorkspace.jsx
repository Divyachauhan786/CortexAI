import { useState } from "react";
import { buildPreviewDocument } from "../utils/codeExtractor";

const CodeWorkspace = ({ files = [], onClose }) => {
    const [activeFileIndex, setActiveFileIndex] = useState(0);
    const [viewMode, setViewMode] = useState("preview"); // "code" | "preview"
    const [copied, setCopied] = useState(false);
    const [previewKey, setPreviewKey] = useState(0);

    if (!files || files.length === 0) {
        return null;
    }

    const activeFile = files[activeFileIndex] || files[0];
    const previewDoc = buildPreviewDocument(files);
    const canPreview = Boolean(previewDoc && previewDoc.trim().length > 0);

    const handleCopyCode = () => {
        if (activeFile?.content) {
            navigator.clipboard.writeText(activeFile.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownloadCurrentFile = () => {
        if (!activeFile) return;
        const blob = new Blob([activeFile.content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = activeFile.name;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadAll = () => {
        files.forEach((file) => {
            const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = file.name;
            link.click();
            URL.revokeObjectURL(url);
        });
    };

    const getFileIcon = (fileName = "") => {
        if (fileName.endsWith(".html")) return "🌐";
        if (fileName.endsWith(".css")) return "🎨";
        if (fileName.endsWith(".js") || fileName.endsWith(".jsx")) return "⚡";
        if (fileName.endsWith(".py")) return "🐍";
        if (fileName.endsWith(".cpp") || fileName.endsWith(".c")) return "⚙";
        if (fileName.endsWith(".json")) return "📦";
        return "📄";
    };

    return (
        <div className="flex h-full w-full flex-col border-l border-white/[0.08] bg-[#0c0d15] text-white">
            {/* ==================================
                WORKSPACE TOP HEADER
            ================================== */}
            <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#0f101a] px-4">
                <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/10 text-xs text-violet-300">
                        &lt;/&gt;
                    </span>
                    <span className="text-xs font-semibold text-slate-200">
                        AI Code Workspace
                    </span>
                    <span className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-slate-500">
                        {files.length} {files.length === 1 ? "file" : "files"}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Mode Toggle: Code vs Preview */}
                    <div className="flex rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5">
                        <button
                            onClick={() => setViewMode("code")}
                            className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                                viewMode === "code"
                                    ? "bg-violet-500/20 text-violet-300 shadow-sm"
                                    : "text-slate-500 hover:text-slate-300"
                            }`}
                        >
                            Code
                        </button>
                        <button
                            onClick={() => setViewMode("preview")}
                            disabled={!canPreview}
                            className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                                !canPreview
                                    ? "cursor-not-allowed opacity-30 text-slate-600"
                                    : viewMode === "preview"
                                    ? "bg-violet-500/20 text-violet-300 shadow-sm"
                                    : "text-slate-500 hover:text-slate-300"
                            }`}
                            title={canPreview ? "Live Preview" : "No HTML/CSS/JS preview available for this language"}
                        >
                            Preview
                        </button>
                    </div>

                    {/* Copy Code */}
                    <button
                        onClick={handleCopyCode}
                        className="flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 text-xs text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                        title="Copy current file code"
                    >
                        <span>{copied ? "✓" : "📋"}</span>
                        <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
                    </button>

                    {/* Download */}
                    <button
                        onClick={files.length > 1 ? handleDownloadAll : handleDownloadCurrentFile}
                        className="flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 text-xs text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                        title="Download files"
                    >
                        <span>↓</span>
                    </button>

                    {/* Close Split Screen */}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.06] hover:text-slate-300"
                            title="Close Code Workspace"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* ==================================
                FILE TABS
            ================================== */}
            <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-white/[0.04] bg-[#090a10] px-3 py-1.5">
                {files.map((file, idx) => {
                    const isActive = idx === activeFileIndex;
                    return (
                        <button
                            key={file.name + idx}
                            onClick={() => {
                                setActiveFileIndex(idx);
                                if (viewMode !== "code" && !canPreview) {
                                    setViewMode("code");
                                }
                            }}
                            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono transition ${
                                isActive
                                    ? "bg-violet-500/15 text-violet-300 border border-violet-500/30"
                                    : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                            }`}
                        >
                            <span className="text-xs">{getFileIcon(file.name)}</span>
                            <span>{file.name}</span>
                        </button>
                    );
                })}
            </div>

            {/* ==================================
                MAIN BODY: CODE OR PREVIEW
            ================================== */}
            <div className="relative min-h-0 flex-1 overflow-hidden">
                {viewMode === "code" ? (
                    <div className="h-full overflow-y-auto p-4 font-mono text-[13px] leading-6 text-slate-300 selection:bg-violet-500/30">
                        <pre className="overflow-x-auto whitespace-pre font-mono">
                            <code>
                                {activeFile?.content.split("\n").map((line, i) => (
                                    <div key={i} className="table-row">
                                        <span className="table-cell select-none pr-4 text-right text-[11px] text-slate-600">
                                            {i + 1}
                                        </span>
                                        <span className="table-cell">{line || " "}</span>
                                    </div>
                                ))}
                            </code>
                        </pre>
                    </div>
                ) : (
                    /* Live sandboxed iframe preview */
                    <div className="flex h-full flex-col bg-white">
                        <div className="flex h-8 shrink-0 items-center justify-between border-b border-slate-200 bg-slate-100 px-3 text-[11px] text-slate-600">
                            <span className="flex items-center gap-1.5 font-medium">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                Live Sandboxed Preview
                            </span>
                            <button
                                onClick={() => setPreviewKey((k) => k + 1)}
                                className="rounded px-2 py-0.5 text-[10px] text-slate-600 hover:bg-slate-200"
                                title="Reload preview"
                            >
                                ↻ Refresh
                            </button>
                        </div>
                        <iframe
                            key={previewKey}
                            srcDoc={previewDoc}
                            title="Code Preview"
                            sandbox="allow-scripts"
                            className="h-full w-full border-0 bg-white"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default CodeWorkspace;
