"use client"
import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";

const API_BASE = "http://localhost:5001";
const BACKEND_URL = `${API_BASE}/api/v1/chat`;

const MOCK_MODE = true; // set false when backend is running

async function fetchHookConfig(email: string) {
    const res = await fetch(`${API_BASE}/api/v1/user/hook-id?email=${encodeURIComponent(email)}`);
    if (!res.ok) return { userId: undefined, hookId: undefined };
    const data = await res.json();
    return { userId: data.userId, hookId: data.hookId };
}

async function sendToBackend(
    message: string,
    from?: string | null,
    userId?: string | number | null,
    hookId?: string | null,
) {
    const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, from, userId, hookId }),
    });
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    return res.json();
}

function MailCard({ mailData }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(JSON.stringify(mailData, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div style={{
            marginTop: 10,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12,
            padding: "14px 16px",
            fontFamily: "'DM Mono', 'Fira Code', monospace",
        }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#a78bfa", textTransform: "uppercase" }}>
                    ✉ Mail Output
                </span>
                <button
                    onClick={copy}
                    style={{
                        fontSize: 11, padding: "3px 10px", borderRadius: 6,
                        border: "1px solid rgba(167,139,250,0.4)", background: "transparent",
                        color: copied ? "#86efac" : "#a78bfa", cursor: "pointer", transition: "all 0.2s",
                    }}
                >
                    {copied ? "Copied!" : "Copy JSON"}
                </button>
            </div>
            <div style={{ fontSize: 12.5, color: "#e2e8f0", lineHeight: 1.7 }}>
                <div><span style={{ color: "#7dd3fc" }}>to:</span> <span style={{ color: "#fbbf24" }}>{mailData.to}</span></div>
                <div><span style={{ color: "#7dd3fc" }}>subject:</span>
                    <span style={{ color: "#fbbf24", marginTop: 6 }}>{mailData.subject}</span></div>
                <div style={{ marginTop: 6 }}>
                    <span style={{ color: "#7dd3fc" }}>body:</span>
                    <div style={{
                        marginTop: 4, padding: "8px 10px",
                        background: "rgba(0,0,0,0.2)", borderRadius: 6,
                        color: "#f1f5f9", whiteSpace: "pre-wrap", lineHeight: 1.6,
                    }}>
                        {mailData.body}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Message({ msg }) {
    const isUser = msg.role === "user";
    return (
        <div style={{
            display: "flex",
            justifyContent: isUser ? "flex-end" : "flex-start",
            marginBottom: 16,
            alignItems: "flex-end",
            gap: 8,
        }}>
            {!isUser && (
                <div style={{
                    width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                    background: "linear-gradient(135deg, #a78bfa, #60a5fa)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, color: "#fff",
                }}>A</div>
            )}
            <div style={{ maxWidth: "72%", minWidth: 60 }}>
                <div style={{
                    padding: "11px 15px",
                    borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    background: isUser
                        ? "linear-gradient(135deg, #7c3aed, #4f46e5)"
                        : "rgba(255,255,255,0.07)",
                    border: isUser ? "none" : "1px solid rgba(255,255,255,0.1)",
                    color: "#f1f5f9",
                    fontSize: 14.5,
                    lineHeight: 1.65,
                    wordBreak: "break-word",
                }}>
                    {msg.content}
                    {msg.mailData && <MailCard mailData={msg.mailData} />}
                </div>
                <div style={{
                    fontSize: 10.5, color: "rgba(255,255,255,0.3)",
                    marginTop: 4, textAlign: isUser ? "right" : "left",
                    paddingLeft: isUser ? 0 : 4,
                }}>
                    {msg.time}
                    {msg.type === "mail" && (
                        <span style={{
                            marginLeft: 6, color: "#a78bfa",
                            fontSize: 10, fontWeight: 600,
                        }}>✉ mail</span>
                    )}
                </div>
            </div>
            {isUser && (
                <div style={{
                    width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                    background: "rgba(255,255,255,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, color: "#f1f5f9",
                }}>U</div>
            )}
        </div>
    );
}

function TypingIndicator() {
    return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 16 }}>
            <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "linear-gradient(135deg, #a78bfa, #60a5fa)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0,
            }}>A</div>
            <div style={{
                padding: "14px 18px", borderRadius: "18px 18px 18px 4px",
                background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
                display: "flex", gap: 5, alignItems: "center",
            }}>
                {[0, 1, 2].map((i) => (
                    <div key={i} style={{
                        width: 7, height: 7, borderRadius: "50%",
                        background: "rgba(255,255,255,0.4)",
                        animation: "pulse 1.2s ease-in-out infinite",
                        animationDelay: `${i * 0.2}s`,
                    }} />
                ))}
            </div>
        </div>
    );
}

const SUGGESTIONS = [
    "Write a message to Chris saying good morning",
    "Tell Arpit about the cricket match tomorrow",
    "What is the capital of France?",
    "Send Priya a message about the weekend plan",
];

export default function App() {
    const { data: session } = useSession();
    const [messages, setMessages] = useState([
        {
            id: 1, role: "assistant", type: "general",
            content: "Hi! I'm your AI mail assistant. Ask me to write a message to someone — or ask me anything! I'll detect if you want to compose an email and parse it into structured JSON.\n\nTry: \"Write a message to Chris saying good morning\"",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [hookConfig, setHookConfig] = useState({ userId: undefined, hookId: undefined });
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    useEffect(() => {
        const email = session?.user?.email;
        if (!email) return;
        fetchHookConfig(email).then(setHookConfig);
    }, [session?.user?.email]);

    const send = async (text) => {
        const msg = (text || input).trim();
        if (!msg || loading) return;
        setInput("");
        setError("");

        const userMsg = {
            id: Date.now(), role: "user", type: "user",
            content: msg,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((m) => [...m, userMsg]);
        setLoading(true);

        try {
            const data = await sendToBackend(msg, session?.user?.email, hookConfig.userId, hookConfig.hookId);
            const aiMsg = {
                id: Date.now() + 1, role: "assistant",
                type: data.type,
                content: data.message || data.error || "No response",
                mailData: data.mailData,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };
            setMessages((m) => [...m, aiMsg]);
        } catch (e) {
            setError(e.message || "Failed to reach backend");
        } finally {
            setLoading(false);
        }
    };

    const handleKey = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send(input);
        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            background: "#0f0f1a",
            backgroundImage: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.18) 0%, transparent 70%)",
            display: "flex",
            flexDirection: "column",
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
        }}>
            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
      `}</style>
            <style jsx>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        textarea::placeholder { color: rgba(255,255,255,0.25); }
        @keyframes pulse { 0%,80%,100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .msg-in { animation: fadeIn 0.25s ease; }
      `}</style>

            {/* Header */}
            <div style={{
                padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(15,15,26,0.8)", backdropFilter: "blur(12px)",
                display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10,
            }}>
                <div style={{
                    width: 38, height: 38, borderRadius: "50%",
                    background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, boxShadow: "0 0 20px rgba(124,58,237,0.4)",
                }}>✉</div>
                <div>
                    <div style={{ fontWeight: 600, color: "#f1f5f9", fontSize: 15 }}>Mail AI Assistant</div>
                    <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)" }}>
                        {MOCK_MODE ? "Mock mode — connect backend to go live" : "Connected to backend"}
                    </div>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{
                        width: 7, height: 7, borderRadius: "50%",
                        background: MOCK_MODE ? "#fbbf24" : "#4ade80",
                        boxShadow: `0 0 8px ${MOCK_MODE ? "#fbbf24" : "#4ade80"}`,
                    }} />
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                        {MOCK_MODE ? "mock" : "live"}
                    </span>
                </div>
            </div>

            {/* Messages */}
            <div style={{
                flex: 1, overflowY: "auto", padding: "24px 16px",
                maxWidth: 760, width: "100%", margin: "0 auto", alignSelf: "stretch",
                display: "flex", flexDirection: "column",
            }}>
                {messages.map((msg) => (
                    <div key={msg.id} className="msg-in">
                        <Message msg={msg} />
                    </div>
                ))}
                {loading && <TypingIndicator />}
                {error && (
                    <div style={{
                        padding: "10px 14px", background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10,
                        color: "#fca5a5", fontSize: 13, marginBottom: 12,
                    }}>
                        ⚠ {error}
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Suggestions (shown when only initial message) */}
            {messages.length === 1 && (
                <div style={{
                    maxWidth: 760, width: "100%", margin: "0 auto", padding: "0 16px 12px",
                    display: "flex", flexWrap: "wrap", gap: 8,
                }}>
                    {SUGGESTIONS.map((s) => (
                        <button key={s} onClick={() => send(s)} style={{
                            padding: "7px 13px", borderRadius: 20,
                            border: "1px solid rgba(124,58,237,0.3)",
                            background: "rgba(124,58,237,0.08)",
                            color: "#c4b5fd", fontSize: 12.5, cursor: "pointer",
                            transition: "all 0.15s",
                        }}
                            onMouseEnter={e => { e.target.style.background = "rgba(124,58,237,0.18)"; e.target.style.borderColor = "rgba(124,58,237,0.6)"; }}
                            onMouseLeave={e => { e.target.style.background = "rgba(124,58,237,0.08)"; e.target.style.borderColor = "rgba(124,58,237,0.3)"; }}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div style={{
                borderTop: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(15,15,26,0.9)", backdropFilter: "blur(12px)",
                padding: "16px", position: "sticky", bottom: 0,
            }}>
                <div style={{
                    maxWidth: 760, margin: "0 auto",
                    display: "flex", gap: 10, alignItems: "flex-end",
                }}>
                    <div style={{
                        flex: 1, background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 16, padding: "10px 14px",
                        transition: "border-color 0.2s",
                    }}>
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder="Write a message to Chris... or ask anything"
                            disabled={loading}
                            rows={1}
                            style={{
                                width: "100%", background: "transparent", border: "none", outline: "none",
                                color: "#f1f5f9", fontSize: 14.5, resize: "none",
                                fontFamily: "inherit", lineHeight: 1.5, maxHeight: 120,
                                overflowY: "auto",
                            }}
                            onInput={(e) => {
                                e.target.style.height = "auto";
                                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                            }}
                        />
                    </div>
                    <button
                        onClick={() => send(input)}
                        disabled={!input.trim() || loading}
                        style={{
                            width: 44, height: 44, borderRadius: "50%", border: "none",
                            background: input.trim() && !loading
                                ? "linear-gradient(135deg, #7c3aed, #4f46e5)"
                                : "rgba(255,255,255,0.08)",
                            cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 18, transition: "all 0.2s", flexShrink: 0,
                            boxShadow: input.trim() && !loading ? "0 0 16px rgba(124,58,237,0.4)" : "none",
                            transform: input.trim() && !loading ? "scale(1)" : "scale(0.95)",
                        }}
                    >
                        {loading ? (
                            <div style={{
                                width: 18, height: 18, borderRadius: "50%",
                                border: "2px solid rgba(255,255,255,0.3)",
                                borderTopColor: "#fff",
                                animation: "spin 0.8s linear infinite",
                            }} />
                        ) : "↑"}
                    </button>
                </div>
                <div style={{
                    textAlign: "center", marginTop: 10,
                    fontSize: 11, color: "rgba(255,255,255,0.2)",
                }}>
                    Enter to send · Shift+Enter for new line · Backend: localhost:3001
                </div>
            </div>

            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
