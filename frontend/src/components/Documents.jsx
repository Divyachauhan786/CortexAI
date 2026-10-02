import { useEffect, useRef, useState } from "react";
import api from "../services/api";

const Documents = ({ userId, onAskAboutDocument }) => {
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadStep, setUploadStep] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [error, setError] = useState("");
    const [documents, setDocuments] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    const fileInputRef = useRef(null);

    // ==========================================
    // LOAD USER DOCUMENTS FROM LOCAL STORAGE
    // ==========================================
    useEffect(() => {
        if (!userId) return;
        try {
            const stored = localStorage.getItem(`cortexai_docs_${userId}`);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setDocuments(parsed);
                }
            }
        } catch (err) {
            console.error("Failed to load documents cache:", err);
        }
    }, [userId]);

    const saveDocuments = (updatedDocs) => {
        setDocuments(updatedDocs);
        if (userId) {
            try {
                localStorage.setItem(
                    `cortexai_docs_${userId}`,
                    JSON.stringify(updatedDocs)
                );
            } catch (err) {
                console.error("Failed to save documents cache:", err);
            }
        }
    };

    // ==========================================
    // VALIDATE & SELECT FILE
    // ==========================================
    const validateAndSelectFile = (selectedFile) => {
        if (!selectedFile) return;

        const allowedTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        const allowedExtensions = [".pdf", ".docx"];
        const fileName = selectedFile.name.toLowerCase();
        const hasValidExtension = allowedExtensions.some((ext) =>
            fileName.endsWith(ext)
        );

        if (!allowedTypes.includes(selectedFile.type) && !hasValidExtension) {
            setFile(null);
            setError("Only PDF and DOCX files are allowed.");
            return;
        }

        // 10 MB limit
        if (selectedFile.size > 10 * 1024 * 1024) {
            setFile(null);
            setError("File size must not exceed 10 MB.");
            return;
        }

        setFile(selectedFile);
        setError("");
        setSuccessMessage("");
    };

    const handleFileChange = (event) => {
        const selected = event.target.files?.[0];
        validateAndSelectFile(selected);
    };

    // ==========================================
    // DRAG AND DROP HANDLERS
    // ==========================================
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            validateAndSelectFile(droppedFile);
            e.dataTransfer.clearData();
        }
    };

    const handleChooseFile = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleRemoveSelectedFile = () => {
        setFile(null);
        setError("");
        setSuccessMessage("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // ==========================================
    // UPLOAD & INDEX DOCUMENT
    // ==========================================
    const handleUpload = async () => {
        if (!file) {
            setError("Please select a PDF or DOCX file to upload.");
            return;
        }

        if (!userId) {
            setError("User authentication unavailable. Please log in again.");
            return;
        }

        setUploading(true);
        setUploadStep("Parsing & generating embeddings...");
        setError("");
        setSuccessMessage("");

        try {
            const formData = new FormData();
            formData.append("document", file);
            formData.append("userId", userId);

            const response = await api.post(
                "/agent/documents/upload",
                formData
            );

            const documentData = response.data?.document;
            const originalName = documentData?.originalName || file.name;
            const storedChunks = documentData?.storedChunks || documentData?.totalChunks || 1;
            const type = originalName.toLowerCase().endsWith(".docx") ? "DOCX" : "PDF";

            const newDoc = {
                id: documentData?.documentId || Date.now().toString(),
                originalName,
                type,
                size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                storedChunks,
                pageCount: documentData?.pageCount || null,
                uploadedAt: new Date().toISOString(),
                status: "Indexed",
            };

            const updatedDocs = [
                newDoc,
                ...documents.filter((d) => d.originalName !== originalName),
            ];

            saveDocuments(updatedDocs);

            setSuccessMessage(
                `"${originalName}" was indexed successfully (${storedChunks} vector chunks stored in Qdrant).`
            );

            setFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (err) {
            console.error("Document upload error:", err);
            setError(
                err.response?.data?.message ||
                    "Failed to process and index document. Please verify your connection."
            );
        } finally {
            setUploading(false);
            setUploadStep("");
        }
    };

    // ==========================================
    // DELETE DOCUMENT
    // ==========================================
    const handleDeleteDocument = (docId) => {
        const updated = documents.filter((d) => d.id !== docId);
        saveDocuments(updated);
    };

    // ==========================================
    // ASK ABOUT DOCUMENT
    // ==========================================
    const handleAskAboutDocument = (doc) => {
        if (typeof onAskAboutDocument === "function") {
            onAskAboutDocument(doc);
        }
    };

    const filteredDocuments = documents.filter((doc) =>
        doc.originalName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalChunksCount = documents.reduce(
        (sum, doc) => sum + (Number(doc.storedChunks) || 0),
        0
    );

    return (
        <div className="space-y-6 text-white">
            {/* ==================================
                STATS OVERVIEW
            ================================== */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/[0.06] bg-[#101118] p-4 shadow-lg shadow-black/20">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">
                            Indexed Documents
                        </span>
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-xs text-violet-300">
                            ▤
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-white">
                        {documents.length}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                        Ready for RAG questions
                    </p>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-[#101118] p-4 shadow-lg shadow-black/20">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">
                            Vector Chunks
                        </span>
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-xs text-purple-300">
                            ✦
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-white">
                        {totalChunksCount}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                        Stored in Qdrant vector database
                    </p>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-[#101118] p-4 shadow-lg shadow-black/20">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">
                            Security & Isolation
                        </span>
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-xs text-emerald-300">
                            🔒
                        </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <p className="text-sm font-semibold text-emerald-400">
                            User Scoped
                        </p>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                        Isolated per account
                    </p>
                </div>
            </div>

            {/* ==================================
                DRAG & DROP UPLOAD ZONE
            ================================== */}
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101118] shadow-2xl shadow-black/30">
                <div className="border-b border-white/[0.05] px-6 py-4">
                    <h3 className="text-sm font-semibold text-slate-200">
                        Upload Document
                    </h3>
                    <p className="text-xs text-slate-500">
                        Supports PDF and DOCX files up to 10 MB
                    </p>
                </div>

                <div className="p-6">
                    {/* Hidden input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    {/* Drop zone */}
                    <div
                        onDragEnter={handleDragEnter}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={handleChooseFile}
                        className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
                            isDragging
                                ? "border-violet-500 bg-violet-500/[0.08] shadow-lg shadow-violet-500/10"
                                : file
                                ? "border-violet-500/40 bg-violet-500/[0.03]"
                                : "border-white/[0.08] bg-white/[0.015] hover:border-violet-500/30 hover:bg-white/[0.03]"
                        }`}
                    >
                        <div
                            className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl transition ${
                                isDragging || file
                                    ? "bg-violet-500/20 text-violet-300 shadow-md shadow-violet-500/20"
                                    : "bg-white/[0.04] text-slate-400 group-hover:bg-violet-500/10 group-hover:text-violet-300"
                            }`}
                        >
                            {file ? (
                                <span className="text-2xl">
                                    {file.name.endsWith(".docx") ? "📝" : "📄"}
                                </span>
                            ) : (
                                <span className="text-2xl">☁️</span>
                            )}
                        </div>

                        {file ? (
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-violet-300">
                                    {file.name}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to index
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-slate-200">
                                    {isDragging
                                        ? "Drop document here"
                                        : "Drag and drop your document here, or click to browse"}
                                </p>
                                <p className="text-xs text-slate-500">
                                    PDF or DOCX documents up to 10 MB
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Action Bar for selected file */}
                    {file && (
                        <div className="mt-4 flex items-center justify-between rounded-xl border border-violet-500/20 bg-violet-500/[0.06] p-3.5">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/20 text-sm text-violet-300">
                                    {file.name.endsWith(".docx") ? "DOCX" : "PDF"}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-xs font-semibold text-slate-200">
                                        {file.name}
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleRemoveSelectedFile}
                                    disabled={uploading}
                                    className="rounded-lg px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-600/20 transition hover:from-violet-500 hover:to-purple-500 disabled:opacity-50"
                                >
                                    {uploading ? (
                                        <>
                                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                            {uploadStep || "Indexing..."}
                                        </>
                                    ) : (
                                        <>
                                            <span>↑</span>
                                            Index Document
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Success notification */}
                    {successMessage && (
                        <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5">
                            <span className="text-base text-emerald-400">✓</span>
                            <div className="flex-1">
                                <p className="text-xs font-medium text-emerald-300">
                                    Indexing Complete
                                </p>
                                <p className="mt-0.5 text-xs text-emerald-400/80">
                                    {successMessage}
                                </p>
                            </div>
                            <button
                                onClick={() => setSuccessMessage("")}
                                className="text-xs text-emerald-400/60 hover:text-emerald-300"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {/* Error notification */}
                    {error && (
                        <div className="mt-4 flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5">
                            <span className="text-base text-rose-400">⚠️</span>
                            <div className="flex-1">
                                <p className="text-xs font-medium text-rose-300">
                                    Upload Failed
                                </p>
                                <p className="mt-0.5 text-xs text-rose-400/80">
                                    {error}
                                </p>
                            </div>
                            <button
                                onClick={() => setError("")}
                                className="text-xs text-rose-400/60 hover:text-rose-300"
                            >
                                ✕
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ==================================
                DOCUMENT LIBRARY & CARDS
            ================================== */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#101118] p-6 shadow-2xl shadow-black/30">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-base font-semibold text-white">
                            Your Document Knowledge Base
                        </h3>
                        <p className="text-xs text-slate-500">
                            CortexAI uses these indexed documents to answer questions with precision.
                        </p>
                    </div>

                    {documents.length > 0 && (
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search documents..."
                                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-1.5 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-violet-500/30 sm:w-60"
                            />
                        </div>
                    )}
                </div>

                {documents.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.04] bg-white/[0.015] px-6 py-12 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-2xl text-violet-300 shadow-inner">
                            ▤
                        </div>
                        <h4 className="text-sm font-semibold text-slate-200">
                            No documents uploaded yet
                        </h4>
                        <p className="mt-1.5 max-w-sm text-xs text-slate-500">
                            Upload your PDF or DOCX documents above to start asking questions, extracting summaries, and performing deep RAG analysis.
                        </p>
                        <button
                            type="button"
                            onClick={handleChooseFile}
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-500/10 px-4 py-2 text-xs font-semibold text-violet-300 transition hover:bg-violet-500/20"
                        >
                            <span>+</span>
                            Select Document to Upload
                        </button>
                    </div>
                ) : filteredDocuments.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                        No documents matched "{searchQuery}"
                    </div>
                ) : (
                    /* Document Cards Grid */
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {filteredDocuments.map((doc) => {
                            const isDocx = doc.type === "DOCX" || doc.originalName?.toLowerCase().endsWith(".docx");

                            return (
                                <div
                                    key={doc.id}
                                    className="group relative flex flex-col justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition hover:border-violet-500/30 hover:bg-white/[0.035] hover:shadow-xl hover:shadow-purple-950/10"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex min-w-0 items-start gap-3">
                                                <div
                                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                                                        isDocx
                                                            ? "bg-blue-500/10 text-blue-400"
                                                            : "bg-rose-500/10 text-rose-400"
                                                    }`}
                                                >
                                                    {isDocx ? "DOCX" : "PDF"}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4
                                                        className="truncate text-sm font-semibold text-slate-200"
                                                        title={doc.originalName}
                                                    >
                                                        {doc.originalName}
                                                    </h4>
                                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                                                        <span>{doc.size}</span>
                                                        <span>•</span>
                                                        <span>
                                                            {doc.storedChunks || 1} chunks
                                                        </span>
                                                        {doc.pageCount && (
                                                            <>
                                                                <span>•</span>
                                                                <span>
                                                                    {doc.pageCount} pages
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleDeleteDocument(doc.id)}
                                                className="opacity-0 transition group-hover:opacity-100 rounded-lg p-1 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400"
                                                title="Remove document from library"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between border-t border-white/[0.04] pt-3">
                                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                            <span>Vector Ready</span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleAskAboutDocument(doc)}
                                            className="flex items-center gap-1.5 rounded-lg bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300 transition hover:bg-violet-500/20 hover:text-white"
                                        >
                                            <span>💬</span>
                                            Ask AI
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ==================================
                SECURITY & RAG EXPLANATION
            ================================== */}
            <div className="flex items-start gap-3.5 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4 text-xs text-slate-400">
                <span className="text-base">🔐</span>
                <div className="space-y-0.5">
                    <p className="font-semibold text-slate-300">
                        CortexAI Retrieval-Augmented Generation (RAG)
                    </p>
                    <p className="leading-5 text-slate-500">
                        Your uploaded documents are parsed, chunked, and embedded into high-dimensional vectors stored in Qdrant. All embeddings are strictly scoped to your user ID, preventing cross-tenant leakage.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Documents;