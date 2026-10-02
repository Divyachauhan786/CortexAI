import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../store/authSlice";
import Documents from "../components/Documents";
import Settings from "../components/Settings";
import CodeWorkspace from "../components/CodeWorkspace";
import ImageCard from "../components/ImageCard";
import { extractCodeFiles } from "../utils/codeExtractor";
import { signOut } from "firebase/auth";
import { firebaseAuth } from "../firebase";

const API_BASE = import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8000";

const Home = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const [activeView, setActiveView] = useState("chat");
    const [activeMode, setActiveMode] = useState("auto");

    const [chatId, setChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [recentChats, setRecentChats] = useState([]);

    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [loadingChats, setLoadingChats] = useState(false);

    // AI Code Workspace state
    const [isCodeWorkspaceOpen, setIsCodeWorkspaceOpen] = useState(false);
    const [activeCodeFiles, setActiveCodeFiles] = useState([]);

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    // ==========================================
    // LOAD RECENT CHATS
    // ==========================================
    const loadRecentChats = async () => {
        try {
            setLoadingChats(true);
            const response = await fetch(`${API_BASE}/chat/`, {
                method: "GET",
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error(`Failed to load chats: ${response.status}`);
            }

            const data = await response.json();
            const chats = data.chats || data.data || data || [];
            setRecentChats(Array.isArray(chats) ? chats : []);
        } catch (error) {
            console.error("Load chats error:", error);
        } finally {
            setLoadingChats(false);
        }
    };

    // ==========================================
    // LOAD CHAT MESSAGES
    // ==========================================
    const loadChatMessages = async (selectedChatId) => {
        try {
            const response = await fetch(
                `${API_BASE}/chat/${selectedChatId}/messages`,
                {
                    method: "GET",
                    credentials: "include",
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to load messages: ${response.status}`);
            }

            const data = await response.json();
            const loadedMessages = data.messages || data.data || [];

            setChatId(selectedChatId);
            setMessages(Array.isArray(loadedMessages) ? loadedMessages : []);
            setActiveView("chat");

            // Check if any message in this chat contains code
            for (let i = loadedMessages.length - 1; i >= 0; i--) {
                const msg = loadedMessages[i];
                if (msg.role === "assistant" && msg.content) {
                    const files = extractCodeFiles(msg.content);
                    if (files.length > 0) {
                        setActiveCodeFiles(files);
                        break;
                    }
                }
            }
        } catch (error) {
            console.error("Load messages error:", error);
        }
    };

    // ==========================================
    // CREATE NEW CHAT
    // ==========================================
    const createNewChat = async () => {
        try {
            const response = await fetch(`${API_BASE}/chat/`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: "New Chat",
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to create chat: ${response.status}`);
            }

            const data = await response.json();
            const newChatId =
                data.chat?._id ||
                data.chat?.id ||
                data.data?._id ||
                data.data?.id ||
                data._id ||
                data.id;

            if (!newChatId) {
                throw new Error("Chat ID was not returned by the server.");
            }

            setChatId(newChatId);
            setMessages([]);
            setActiveCodeFiles([]);
            setIsCodeWorkspaceOpen(false);
            setActiveView("chat");

            await loadRecentChats();
            return newChatId;
        } catch (error) {
            console.error("Create chat error:", error);
            return null;
        }
    };

    // ==========================================
    // SEND MESSAGE
    // ==========================================
    const sendMessage = async () => {
        const trimmedInput = input.trim();

        if (!trimmedInput || isStreaming) {
            return;
        }

        let currentChatId = chatId;

        // Create chat automatically if needed
        if (!currentChatId) {
            currentChatId = await createNewChat();
            if (!currentChatId) {
                return;
            }
        }

        const userMessage = {
            role: "user",
            content: trimmedInput,
        };

        setMessages((previous) => [...previous, userMessage]);
        setInput("");

        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }

        // ======================================
        // IMAGE GENERATION MODE
        // ======================================
        if (activeMode === "image") {
            const seed = Math.floor(Math.random() * 1000000);
            const encodedPrompt = encodeURIComponent(trimmedInput);
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${seed}`;

            const assistantImageMessage = {
                role: "assistant",
                content: trimmedInput,
                type: "image",
                imageUrl,
                prompt: trimmedInput,
            };

            setMessages((previous) => [...previous, assistantImageMessage]);
            await loadRecentChats();
            return;
        }

        // ======================================
        // STREAMING AI RESPONSE
        // ======================================
        setIsStreaming(true);

        // Placeholder assistant message
        setMessages((previous) => [
            ...previous,
            {
                role: "assistant",
                content: "",
            },
        ]);

        try {
            const response = await fetch(
                `${API_BASE}/chat/${currentChatId}/stream`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        content: trimmedInput,
                        mode: activeMode,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(`Request failed: ${response.status}`);
            }

            if (!response.body) {
                throw new Error("Streaming response body is unavailable.");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = "";
            let accumulatedContent = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const events = buffer.split("\n\n");
                buffer = events.pop() || "";

                for (const event of events) {
                    const lines = event.split("\n");
                    let eventType = "message";
                    let eventData = "";

                    for (const line of lines) {
                        if (line.startsWith("event:")) {
                            eventType = line.slice(6).trim();
                        }
                        if (line.startsWith("data:")) {
                            eventData += line.slice(5).trim();
                        }
                    }

                    if (!eventData) continue;

                    let parsedData;
                    try {
                        parsedData = JSON.parse(eventData);
                    } catch {
                        parsedData = eventData;
                    }

                    // TOKEN
                    if (eventType === "token" || parsedData?.type === "token") {
                        const token =
                            typeof parsedData === "string"
                                ? parsedData
                                : (parsedData?.token ??
                                   parsedData?.content ??
                                   parsedData?.text ??
                                   "");

                        if (!token) continue;

                        accumulatedContent += token;

                        setMessages((previous) => {
                            const updated = [...previous];
                            const lastIndex = updated.length - 1;
                            if (lastIndex >= 0) {
                                updated[lastIndex] = {
                                    ...updated[lastIndex],
                                    content:
                                        (updated[lastIndex]?.content || "") +
                                        token,
                                };
                            }
                            return updated;
                        });
                    }

                    // DONE
                    if (eventType === "done" || parsedData?.type === "done") {
                        setIsStreaming(false);

                        // Auto-extract code blocks if in coding mode or code present
                        if (accumulatedContent) {
                            const extracted = extractCodeFiles(accumulatedContent);
                            if (extracted.length > 0) {
                                setActiveCodeFiles(extracted);
                                if (activeMode === "coding") {
                                    setIsCodeWorkspaceOpen(true);
                                }
                            }
                        }
                    }

                    // ERROR
                    if (eventType === "error" || parsedData?.type === "error") {
                        const errorMessage =
                            typeof parsedData === "object"
                                ? parsedData?.message ||
                                  parsedData?.error ||
                                  "AI request failed."
                                : parsedData;

                        setMessages((previous) => {
                            const updated = [...previous];
                            const lastIndex = updated.length - 1;
                            if (lastIndex >= 0) {
                                updated[lastIndex] = {
                                    ...updated[lastIndex],
                                    content: errorMessage,
                                };
                            }
                            return updated;
                        });

                        setIsStreaming(false);
                    }
                }
            }

            await loadRecentChats();
        } catch (error) {
            console.error("Send message error:", error);

            setMessages((previous) => {
                const updated = [...previous];
                const lastIndex = updated.length - 1;
                if (lastIndex >= 0) {
                    updated[lastIndex] = {
                        ...updated[lastIndex],
                        content:
                            "Something went wrong while connecting to the AI service.",
                    };
                }
                return updated;
            });
        } finally {
            setIsStreaming(false);
        }
    };

    // ==========================================
    // KEYBOARD HANDLING
    // ==========================================
    const handleKeyDown = (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    };

    // ==========================================
    // AUTO RESIZE TEXTAREA
    // ==========================================
    const handleInputChange = (event) => {
        setInput(event.target.value);

        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
        }
    };

    // ==========================================
    // LOGOUT
    // ==========================================
    const handleLogout = async () => {
        try {
            await dispatch(logoutUser());
            await signOut(firebaseAuth);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    // ==========================================
    // SCROLL TO BOTTOM
    // ==========================================
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages]);

    // ==========================================
    // LOAD CHATS ON START
    // ==========================================
    useEffect(() => {
        loadRecentChats();
    }, []);

    // ==========================================
    // HELPERS
    // ==========================================
    const getChatTitle = (chat) => {
        return chat?.title || chat?.name || "New Conversation";
    };

    const getChatId = (chat) => {
        return chat?._id || chat?.id;
    };

    // Open code workspace for a specific message
    const handleOpenWorkspace = (content) => {
        const extracted = extractCodeFiles(content);
        if (extracted.length > 0) {
            setActiveCodeFiles(extracted);
            setIsCodeWorkspaceOpen(true);
        }
    };

    // Render message body with support for code blocks and image cards
    const renderMessageBody = (message, index) => {
        if (message.type === "image" || message.imageUrl) {
            return (
                <ImageCard
                    imageUrl={message.imageUrl}
                    prompt={message.prompt || message.content}
                />
            );
        }

        const content = message.content || "";
        const codeFiles = extractCodeFiles(content);
        const hasCode = codeFiles.length > 0;

        // Split by markdown code blocks
        const parts = content.split(/(```[\s\S]*?```)/g);

        return (
            <div className="space-y-3">
                {parts.map((part, pIdx) => {
                    if (part.startsWith("```") && part.endsWith("```")) {
                        const lines = part.slice(3, -3).trim().split("\n");
                        const firstLine = lines[0].trim();
                        const code = (firstLine.match(/^[a-zA-Z0-9_-]+$/) ? lines.slice(1) : lines).join("\n");
                        const lang = firstLine.match(/^[a-zA-Z0-9_-]+$/) ? firstLine : "code";

                        return (
                            <div
                                key={pIdx}
                                className="my-2 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0d14] text-xs shadow-lg"
                            >
                                <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#12131e] px-3.5 py-1.5 text-[11px] text-slate-400">
                                    <span className="font-mono uppercase font-semibold text-violet-300">
                                        {lang}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => navigator.clipboard.writeText(code)}
                                            className="rounded px-2 py-0.5 text-slate-400 hover:bg-white/[0.06] hover:text-white"
                                        >
                                            Copy
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleOpenWorkspace(content)}
                                            className="rounded bg-violet-500/15 px-2 py-0.5 text-violet-300 hover:bg-violet-500/25"
                                        >
                                            Open in Workspace ↗
                                        </button>
                                    </div>
                                </div>
                                <pre className="overflow-x-auto p-3.5 font-mono leading-5 text-slate-300">
                                    <code>{code}</code>
                                </pre>
                            </div>
                        );
                    }

                    return (
                        <div key={pIdx}>
                            {part.split("\n").map((line, lIdx, arr) => (
                                <span key={lIdx}>
                                    {line}
                                    {lIdx < arr.length - 1 && <br />}
                                </span>
                            ))}
                        </div>
                    );
                })}

                {hasCode && !isCodeWorkspaceOpen && (
                    <div className="pt-1">
                        <button
                            type="button"
                            onClick={() => handleOpenWorkspace(content)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3.5 py-1.5 text-xs font-semibold text-violet-300 transition hover:bg-violet-500/20 hover:text-white"
                        >
                            <span>&lt;/&gt;</span>
                            <span>Open in AI Code Workspace</span>
                        </button>
                    </div>
                )}
            </div>
        );
    };

    // ==========================================
    // MODES
    // ==========================================
    const modes = [
        { id: "auto", label: "Auto", icon: "✦" },
        { id: "chat", label: "Chat", icon: "▢" },
        { id: "coding", label: "Coding", icon: "</>" },
        { id: "search", label: "Search", icon: "◎" },
        { id: "pdf", label: "PDF", icon: "▤" },
        { id: "image", label: "Image", icon: "▧" },
        { id: "ppt", label: "PPT", icon: "▱", disabled: true, badge: "Soon" },
    ];

    const currentChat = recentChats.find((chat) => getChatId(chat) === chatId);

    // ==========================================
    // UI
    // ==========================================
    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#08090f] text-white">
            {/* ======================================
                LEFT SIDEBAR
            ====================================== */}
            <aside className="flex w-[280px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0a0b11]">
                {/* LOGO */}
                <div className="flex h-[76px] items-center justify-between border-b border-white/[0.05] px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 shadow-lg shadow-purple-500/20">
                            ✦
                        </div>
                        <div>
                            <h1 className="text-[17px] font-semibold tracking-tight">
                                CortexAI
                            </h1>
                            <p className="text-[10px] uppercase tracking-widest text-slate-500">
                                AI Workspace
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[11px] font-medium text-violet-300">
                            Free
                        </span>
                        <button
                            onClick={createNewChat}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
                            title="New conversation"
                        >
                            ↗
                        </button>
                    </div>
                </div>

                {/* NEW CHAT */}
                <div className="px-4 pt-5">
                    <button
                        onClick={createNewChat}
                        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3.5 text-sm font-semibold shadow-lg shadow-purple-600/20 transition hover:from-violet-500 hover:to-purple-500 hover:shadow-purple-500/30"
                    >
                        <span className="text-lg">+</span>
                        New Chat
                    </button>
                </div>

                {/* RECENTS */}
                <div className="flex-1 overflow-y-auto px-3 pt-7">
                    <div className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                        Recents
                    </div>

                    {loadingChats ? (
                        <div className="px-3 py-4 text-xs text-slate-500">
                            Loading conversations...
                        </div>
                    ) : recentChats.length === 0 ? (
                        <div className="px-3 py-4 text-xs text-slate-600">
                            No recent conversations
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {recentChats.map((chat) => {
                                const id = getChatId(chat);
                                const isActive = id === chatId;

                                return (
                                    <button
                                        key={id}
                                        onClick={() => loadChatMessages(id)}
                                        className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                                            isActive
                                                ? "bg-violet-500/10 text-white"
                                                : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                                        }`}
                                    >
                                        <div
                                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                                isActive
                                                    ? "bg-violet-500/15 text-violet-300"
                                                    : "bg-white/[0.04] text-slate-500"
                                            }`}
                                        >
                                            ▢
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm font-medium">
                                                {getChatTitle(chat)}
                                            </div>
                                            <div className="mt-0.5 text-[10px] text-slate-600">
                                                Conversation
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* SIDEBAR NAVIGATION + USER */}
                <div className="border-t border-white/[0.05] p-3">
                    {/* Navigation */}
                    <div className="mb-3 space-y-1">
                        <button
                            onClick={() => {
                                setActiveView("chat");
                                setActiveMode("auto");
                            }}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                                activeView === "chat"
                                    ? "bg-white/[0.07] text-white"
                                    : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200"
                            }`}
                        >
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04]">
                                💬
                            </span>
                            <span>Chat</span>
                        </button>

                        <button
                            onClick={() => {
                                setActiveView("documents");
                                setActiveMode("pdf");
                            }}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                                activeView === "documents"
                                    ? "bg-white/[0.07] text-white"
                                    : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200"
                            }`}
                        >
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04]">
                                📄
                            </span>
                            <span>Documents</span>
                        </button>

                        <button
                            onClick={() => setActiveView("settings")}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                                activeView === "settings"
                                    ? "bg-white/[0.07] text-white"
                                    : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200"
                            }`}
                        >
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04]">
                                ⚙
                            </span>
                            <span>Settings</span>
                        </button>
                    </div>

                    {/* User */}
                    <div className="flex items-center gap-3 rounded-xl bg-white/[0.025] p-3">
                        {user?.avatar ? (
                            <img
                                src={user.avatar}
                                alt={user?.name || "User"}
                                className="h-9 w-9 shrink-0 rounded-full border border-white/[0.1] object-cover"
                            />
                        ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-sm font-semibold">
                                {user?.name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                        )}

                        <div
                            onClick={() => setActiveView("settings")}
                            className="min-w-0 flex-1 cursor-pointer"
                            title="Open Settings"
                        >
                            <p className="truncate text-sm font-medium text-slate-200 hover:text-white">
                                {user?.name || "User"}
                            </p>

                            <p className="truncate text-[10px] text-slate-500">
                                {user?.credits ?? 100} credits • Free
                            </p>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                            title="Logout"
                        >
                            ↪
                        </button>
                    </div>
                </div>
            </aside>

            {/* ======================================
                MAIN AREA
            ====================================== */}
            <main className="relative flex min-w-0 flex-1 flex-col bg-[#08090f]">
                {/* ==================================
                    TOP HEADER
                ================================== */}
                <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/[0.05] px-7">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                            {activeView === "documents"
                                ? "▤"
                                : activeView === "settings"
                                ? "⚙"
                                : "▢"}
                        </div>

                        <div>
                            <h2 className="max-w-[400px] truncate text-sm font-semibold text-slate-200">
                                {activeView === "documents"
                                    ? "Document Intelligence"
                                    : activeView === "settings"
                                    ? "Account & Settings"
                                    : currentChat
                                    ? getChatTitle(currentChat)
                                    : "New Conversation"}
                            </h2>
                            <p className="text-[11px] text-slate-600">
                                {activeView === "chat"
                                    ? `${messages.length} Messages`
                                    : "CortexAI Workspace"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Toggle Code Workspace Button if code is available */}
                        {activeCodeFiles.length > 0 && activeView === "chat" && (
                            <button
                                onClick={() => setIsCodeWorkspaceOpen(!isCodeWorkspaceOpen)}
                                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                                    isCodeWorkspaceOpen
                                        ? "border-violet-500 bg-violet-500/20 text-violet-300"
                                        : "border-white/[0.08] bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
                                }`}
                                title="Toggle Code Workspace"
                            >
                                <span>&lt;/&gt;</span>
                                <span className="hidden sm:inline">
                                    {isCodeWorkspaceOpen ? "Close Code" : "Code Workspace"}
                                </span>
                            </button>
                        )}

                        <button
                            onClick={() => setActiveView("settings")}
                            className="flex items-center gap-1.5 rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300 transition hover:bg-violet-500/20"
                            title="View Plan & Credits"
                        >
                            <span>⚡</span>
                            <span>{user?.credits ?? 100} Credits</span>
                        </button>

                        <button
                            onClick={() => setActiveView("settings")}
                            className="flex items-center transition hover:opacity-80"
                            title="Open Profile Settings"
                        >
                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user?.name || "User"}
                                    className="h-8 w-8 rounded-full border border-white/[0.1] object-cover"
                                />
                            ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-xs font-semibold">
                                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                                </div>
                            )}
                        </button>
                    </div>
                </header>

                {/* ==================================
                    DOCUMENTS VIEW
                ================================== */}
                {activeView === "documents" && (
                    <div className="flex-1 overflow-y-auto px-6 py-8">
                        <div className="mx-auto max-w-5xl">
                            <div className="mb-8">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">
                                    Document Intelligence
                                </p>
                                <h2 className="text-3xl font-semibold tracking-tight">
                                    Your Documents
                                </h2>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                    Upload PDF or DOCX documents and interact with them
                                    using CortexAI's RAG pipeline.
                                </p>
                            </div>

                            <Documents
                                userId={user?._id || user?.id}
                                onAskAboutDocument={(doc) => {
                                    setActiveMode("pdf");
                                    setActiveView("chat");
                                    if (doc?.originalName) {
                                        setInput(
                                            `Based on the document "${doc.originalName}", `
                                        );
                                    }
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* ==================================
                    SETTINGS VIEW
                ================================== */}
                {activeView === "settings" && (
                    <div className="flex-1 overflow-y-auto">
                        <Settings
                            user={user}
                            onLogout={handleLogout}
                            onNavigateToChat={() => setActiveView("chat")}
                        />
                    </div>
                )}

                {/* ==================================
                    CHAT VIEW (SPLIT-SCREEN CAPABLE)
                ================================== */}
                {activeView === "chat" && (
                    <div className="flex min-h-0 flex-1 overflow-hidden">
                        {/* LEFT: CONVERSATION & COMPOSER */}
                        <div className={`flex flex-col min-h-0 flex-1 transition-all duration-300 ${
                            isCodeWorkspaceOpen ? "lg:w-1/2 w-full" : "w-full"
                        }`}>
                            {/* MESSAGE AREA */}
                            <div className="min-h-0 flex-1 overflow-y-auto">
                                {messages.length === 0 ? (
                                    <div className="flex h-full items-center justify-center px-6">
                                        <div className="w-full max-w-2xl text-center">
                                            <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/20 to-purple-600/10 text-3xl shadow-lg shadow-purple-500/10">
                                                ✦
                                            </div>
                                            <h2 className="text-3xl font-semibold tracking-tight text-white">
                                                CortexAI
                                            </h2>
                                            <p className="mt-3 text-lg text-slate-400">
                                                How can I help you?
                                            </p>
                                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                                                Ask me anything — code, ideas, explanations,
                                                documents, images, or a quick question.
                                            </p>

                                            <div className="mt-8 flex flex-wrap justify-center gap-2">
                                                {[
                                                    "Build a modern calculator in HTML/CSS/JS",
                                                    "A futuristic neon cyberpunk city",
                                                    "Explain Redis caching",
                                                    "What is RAG pipeline?",
                                                ].map((suggestion) => (
                                                    <button
                                                        key={suggestion}
                                                        onClick={() => setInput(suggestion)}
                                                        className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-2.5 text-xs text-slate-400 transition hover:border-violet-500/20 hover:bg-violet-500/[0.06] hover:text-slate-200"
                                                    >
                                                        {suggestion}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mx-auto w-full max-w-5xl px-6 py-8">
                                        <div className="space-y-8">
                                            {messages.map((message, index) => {
                                                const isUser = message.role === "user";

                                                return (
                                                    <div
                                                        key={index}
                                                        className={`flex ${
                                                            isUser
                                                                ? "justify-end"
                                                                : "justify-start"
                                                        }`}
                                                    >
                                                        {isUser ? (
                                                            <div className="max-w-[75%]">
                                                                <div className="rounded-2xl rounded-br-md bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3.5 text-sm leading-6 text-white shadow-lg shadow-purple-900/10">
                                                                    {message.content}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex max-w-[85%] gap-4">
                                                                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-sm text-violet-300">
                                                                    ✦
                                                                </div>
                                                                <div className="min-w-0 flex-1 pt-1">
                                                                    <div className="mb-2 text-xs font-semibold text-violet-300">
                                                                        CortexAI
                                                                    </div>
                                                                    <div className="text-[15px] leading-7 text-slate-300">
                                                                        {renderMessageBody(
                                                                            message,
                                                                            index
                                                                        )}
                                                                        {isStreaming &&
                                                                            index ===
                                                                                messages.length -
                                                                                    1 && (
                                                                                <span className="ml-1 inline-block h-4 w-1 animate-pulse rounded-full bg-violet-400" />
                                                                            )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </div>

                            {/* ==================================
                                CORTEXAI COMPOSER
                            ================================== */}
                            <div className="shrink-0 border-t border-white/[0.05] bg-[#08090f]/95 px-5 pb-6 pt-4 backdrop-blur-xl">
                                <div className="mx-auto max-w-4xl">
                                    {/* MODE BAR */}
                                    <div className="mb-3 flex items-center justify-between">
                                        <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
                                            {modes.map((mode) => {
                                                const active = activeMode === mode.id;

                                                return (
                                                    <button
                                                        key={mode.id}
                                                        onClick={() => {
                                                            if (mode.disabled) return;
                                                            setActiveMode(mode.id);
                                                            if (mode.id === "pdf") {
                                                                setActiveView("documents");
                                                            } else if (activeView !== "chat") {
                                                                setActiveView("chat");
                                                            }
                                                        }}
                                                        disabled={mode.disabled}
                                                        className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition ${
                                                            mode.disabled
                                                                ? "cursor-not-allowed opacity-40 text-slate-600"
                                                                : active
                                                                ? "bg-violet-500/15 text-violet-300"
                                                                : "text-slate-600 hover:bg-white/[0.04] hover:text-slate-300"
                                                        }`}
                                                        title={mode.disabled ? `${mode.label} (Coming soon)` : mode.label}
                                                    >
                                                        <span className="text-xs">
                                                            {mode.icon}
                                                        </span>
                                                        {mode.label}
                                                        {mode.badge && (
                                                            <span className="rounded bg-white/[0.06] px-1 py-0.5 text-[9px] text-slate-500">
                                                                {mode.badge}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <div className="hidden shrink-0 items-center gap-2 pl-3 sm:flex">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                            <span className="text-[10px] text-slate-600">
                                                AI Online
                                            </span>
                                        </div>
                                    </div>

                                    {/* COMPOSER */}
                                    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101118] shadow-2xl shadow-black/30 transition focus-within:border-violet-500/30 focus-within:shadow-violet-900/10">
                                        <div className="flex items-end gap-2 p-3">
                                            {/* ATTACHMENT */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setActiveView("documents");
                                                    setActiveMode("pdf");
                                                }}
                                                className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg text-slate-500 transition hover:bg-white/[0.05] hover:text-slate-200"
                                                title="Attach document"
                                            >
                                                +
                                            </button>

                                            {/* TEXTAREA */}
                                            <textarea
                                                ref={textareaRef}
                                                value={input}
                                                onChange={handleInputChange}
                                                onKeyDown={handleKeyDown}
                                                placeholder={
                                                    activeMode === "coding"
                                                        ? "Describe the code or full-stack software to build..."
                                                        : activeMode === "search"
                                                          ? "Search the web for latest information..."
                                                          : activeMode === "pdf"
                                                            ? "Ask something about your documents..."
                                                            : activeMode === "image"
                                                              ? "Describe the AI image you want to generate..."
                                                              : "Message CortexAI..."
                                                }
                                                rows={1}
                                                disabled={isStreaming}
                                                className="max-h-[180px] min-h-[46px] flex-1 resize-none bg-transparent px-1 py-2 text-[14px] leading-6 text-slate-200 outline-none placeholder:text-slate-600 disabled:cursor-not-allowed"
                                            />

                                            {/* SEND */}
                                            <button
                                                onClick={sendMessage}
                                                disabled={!input.trim() || isStreaming}
                                                className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 text-base text-white shadow-lg shadow-purple-600/20 transition hover:from-violet-500 hover:to-purple-500 hover:shadow-purple-500/30 disabled:cursor-not-allowed disabled:opacity-30"
                                                title="Send message"
                                            >
                                                {isStreaming ? (
                                                    <span className="text-xs">•••</span>
                                                ) : (
                                                    "↑"
                                                )}
                                            </button>
                                        </div>

                                        {/* COMPOSER FOOTER */}
                                        <div className="flex items-center justify-between border-t border-white/[0.04] px-4 py-2">
                                            <div className="flex items-center gap-2">
                                                <span className="rounded-md bg-white/[0.04] px-2 py-1 text-[10px] text-slate-500">
                                                    {activeMode === "auto"
                                                        ? "Auto"
                                                        : modes.find(
                                                              (mode) =>
                                                                  mode.id === activeMode
                                                          )?.label}
                                                </span>
                                                <span className="hidden text-[10px] text-slate-700 sm:inline">
                                                    CortexAI
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <span className="hidden text-[10px] text-slate-600 sm:block">
                                                    Enter to send
                                                </span>
                                                <span className="text-[10px] text-slate-700">
                                                    Shift + Enter for new line
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="mt-2 text-center text-[10px] text-slate-700">
                                        CortexAI can make mistakes. Verify important information.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: SPLIT-SCREEN CODE WORKSPACE */}
                        {isCodeWorkspaceOpen && activeCodeFiles.length > 0 && (
                            <div className="hidden lg:flex lg:w-1/2 min-h-0 h-full">
                                <CodeWorkspace
                                    files={activeCodeFiles}
                                    onClose={() => setIsCodeWorkspaceOpen(false)}
                                />
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Home;