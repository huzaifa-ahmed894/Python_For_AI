"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, ReactNode } from "react";

type ChatMessage = { role: "user" | "ai"; content: string };
type Thread = { id: string; title: string; updatedAt: number };

const STORAGE_KEY = "xander-chat-threads-v1";
const ACTIVE_KEY = "xander-chat-active-v1";
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/$/, "");

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  const paths: Record<string, ReactNode> = {
    plus: <><path d="M12 5v14M5 12h14" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></>,
    paperclip: <path d="m21.4 11.6-8.9 8.9a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5" />,
    send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2Z" /><path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2Z" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
  };
  return <svg {...common}>{paths[name] || paths.spark}</svg>;
}

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `session-${Date.now()}`;
}

function titleFor(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 30 ? `${clean.slice(0, 30).trim()}…` : clean || "New conversation";
}

export default function Home() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeSession = useRef("");

  const loadSession = useCallback(async (id: string) => {
    activeSession.current = id;
    setSessionId(id);
    setMessages([]);
    setError("");
    setBooting(true);
    try {
      const response = await fetch(`${API_URL}/ai/history?session_id=${encodeURIComponent(id)}`);
      if (!response.ok) throw new Error(`Could not load conversation (${response.status}).`);
      const data = await response.json();
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch {
      setError("Couldn’t connect to your agent. Check that the FastAPI server is running, then try again.");
    } finally {
      setBooting(false);
    }
  }, []);

  useEffect(() => {
    try {
      const saved: Thread[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const valid = Array.isArray(saved) ? saved : [];
      setThreads(valid);
      const linkedSession = new URLSearchParams(window.location.search).get("session_id");
      const active = linkedSession || localStorage.getItem(ACTIVE_KEY);
      if (active) void loadSession(active);
      else {
        const id = newId();
        activeSession.current = id;
        setSessionId(id);
        setBooting(false);
      }
    } catch {
      const id = newId();
      activeSession.current = id;
      setSessionId(id);
      setBooting(false);
    }
  }, [loadSession]);

  useEffect(() => {
    if (!booting) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, booting]);

  useEffect(() => {
    const area = textareaRef.current;
    if (!area) return;
    area.style.height = "auto";
    area.style.height = `${Math.min(area.scrollHeight, 180)}px`;
  }, [draft]);

  const persistThreads = (next: Thread[]) => {
    setThreads(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const createChat = () => {
    const id = newId();
    activeSession.current = id;
    setSessionId(id);
    setMessages([]);
    setError("");
    setBooting(false);
    localStorage.setItem(ACTIVE_KEY, id);
    window.history.replaceState({}, "", window.location.pathname);
    setSidebarOpen(false);
    textareaRef.current?.focus();
  };

  const selectChat = (id: string) => {
    localStorage.setItem(ACTIVE_KEY, id);
    window.history.replaceState({}, "", `${window.location.pathname}?session_id=${encodeURIComponent(id)}`);
    void loadSession(id);
    setSidebarOpen(false);
  };

  const shareChat = async () => {
    if (!sessionId) return;
    const url = new URL(window.location.href);
    url.searchParams.set("session_id", sessionId);
    window.history.replaceState({}, "", url);
    try {
      await navigator.clipboard.writeText(url.toString());
    } catch {
      setError("The conversation link is ready in your address bar. Copy it to share.");
    }
  };

  const sendMessage = async (event?: FormEvent) => {
    event?.preventDefault();
    const query = draft.trim();
    if (!query || loading || !sessionId) return;
    setDraft("");
    setError("");
    setMessages((current) => [...current, { role: "user", content: query }]);
    setLoading(true);
    localStorage.setItem(ACTIVE_KEY, sessionId);
    const existing = threads.find((thread) => thread.id === sessionId);
    const nextThreads = [{ id: sessionId, title: existing?.title || titleFor(query), updatedAt: Date.now() }, ...threads.filter((thread) => thread.id !== sessionId)];
    persistThreads(nextThreads);
    try {
      const response = await fetch(`${API_URL}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, session_id: sessionId }),
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.detail || `The agent returned an error (${response.status}).`);
      }
      const data = await response.json();
      if (activeSession.current === sessionId) {
        setMessages((current) => [...current, { role: "ai", content: String(data.answer ?? "") }]);
      }
      const updated = nextThreads.map((thread) => thread.id === sessionId ? { ...thread, updatedAt: Date.now() } : thread);
      persistThreads(updated);
    } catch (cause) {
      if (activeSession.current === sessionId) {
        setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
        setMessages((current) => current.filter((message, index) => !(message.role === "user" && index === current.length - 1 && message.content === query)));
        setDraft(query);
      }
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const filteredThreads = threads.filter((thread) => thread.title.toLowerCase().includes(search.toLowerCase()));
  const quickPrompts = [
    { icon: "spark", label: "Explore the menu", text: "What are some popular items on the menu?" },
    { icon: "arrow", label: "Track an order", text: "Can you help me check on an order?" },
    { icon: "sun", label: "Find something for lunch", text: "Suggest something good for lunch." },
  ];

  return (
    <main className="app-shell">
      {sidebarOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <a className="brand" href="#" aria-label="Xander home" onClick={(e) => { e.preventDefault(); createChat(); }}>
            <span className="brand-mark"><Icon name="spark" size={20} /></span>
            <span className="brand-name">xander<span className="brand-period">.</span></span>
          </a>
          <button className="icon-button sidebar-collapse" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)}><Icon name="close" /></button>
        </div>
        <button className="new-chat-button" onClick={createChat}><Icon name="plus" size={17} /><span>New conversation</span><kbd>⌘ K</kbd></button>
        <label className="search-box"><Icon name="search" size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations" /><kbd>⌘ F</kbd></label>
        <div className="nav-label">YOUR SPACE</div>
        <nav className="thread-list" aria-label="Recent conversations">
          {filteredThreads.length > 0 ? filteredThreads.map((thread) => (
            <button key={thread.id} className={`thread-item ${thread.id === sessionId ? "thread-active" : ""}`} onClick={() => selectChat(thread.id)}>
              <span className="thread-title">{thread.title}</span><span className="thread-more"><Icon name="more" size={17} /></span>
            </button>
          )) : <p className="no-threads">{search ? "No conversations found" : "Your conversations will show up here."}</p>}
        </nav>
        <div className="sidebar-bottom">
          <div className="plan-card"><div className="plan-icon"><Icon name="spark" size={16} /></div><div><strong>Your assistant, ready</strong><p>Here whenever you need a hand.</p></div><Icon name="chevron" size={15} /></div>
          <button className="profile-button"><span className="avatar">G</span><span className="profile-copy"><strong>Guest</strong><small>Personal workspace</small></span><Icon name="more" size={17} /></button>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Icon name="menu" /></button>
          <div className="model-switch"><span className="online-dot" /><span>Xander Assistant</span><span className="model-version">· AI</span><Icon name="chevron" size={14} /></div>
          <div className="topbar-actions"><span className="connection-label"><span className="online-dot" /> Connected</span><button className="share-button" onClick={() => void shareChat()}><Icon name="arrow" size={15} /> Share</button><button className="icon-button more-top" aria-label="More options"><Icon name="more" /></button></div>
        </header>

        <div className={`conversation ${messages.length === 0 ? "conversation-empty" : ""}`}>
          {booting ? <div className="loading-history"><span className="spinner" /> Loading your conversation…</div> : messages.length === 0 ? (
            <div className="welcome-wrap">
              <div className="welcome-eyebrow"><span className="eyebrow-line" /> YOUR PERSONAL ASSISTANT <span className="eyebrow-line" /></div>
              <div className="welcome-orb"><div className="orb-inner"><Icon name="spark" size={27} /></div><span className="orb-spark orb-spark-one">✳</span><span className="orb-spark orb-spark-two">✦</span></div>
              <h1>A little help goes<br /><em>a long way.</em></h1>
              <p className="welcome-copy">Good to see you. Ask me anything about the menu,<br className="desktop-only" /> your order, or what sounds good today.</p>
              <div className="prompt-grid">
                {quickPrompts.map((prompt) => <button key={prompt.label} className="prompt-card" onClick={() => { setDraft(prompt.text); textareaRef.current?.focus(); }}><span className="prompt-icon"><Icon name={prompt.icon} size={17} /></span><span>{prompt.label}</span><Icon name="chevron" size={15} /></button>)}
              </div>
            </div>
          ) : (
            <div className="message-list">
              <div className="conversation-date"><span /> TODAY <span /></div>
              {messages.map((message, index) => <article key={`${index}-${message.role}`} className={`message-row ${message.role === "user" ? "message-user" : "message-ai"}`}>
                {message.role === "ai" && <div className="assistant-avatar"><Icon name="spark" size={15} /></div>}
                <div className="message-body"><div className="message-meta"><strong>{message.role === "user" ? "You" : "Xander"}</strong><time>{message.role === "user" ? "You" : "Assistant"}</time></div><div className="message-content">{message.content}</div>{message.role === "ai" && <div className="message-tools"><button aria-label="Copy response" onClick={() => navigator.clipboard?.writeText(message.content)}><CopyIcon /></button><button aria-label="Good response"><ThumbIcon /></button></div>}</div>
              </article>)}
              {loading && <article className="message-row message-ai"><div className="assistant-avatar"><Icon name="spark" size={15} /></div><div className="message-body"><div className="message-meta"><strong>Xander</strong><time>Thinking</time></div><div className="typing-indicator"><i /><i /><i /></div></div></article>}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="composer-area">
          {error && <div className="error-banner" role="alert"><span>{error}</span><button onClick={() => setError("")}>Dismiss</button></div>}
          <form className="composer" onSubmit={sendMessage}>
            <textarea ref={textareaRef} rows={1} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKeyDown} placeholder="Ask anything…" disabled={booting} aria-label="Message Xander" />
            <div className="composer-footer"><div className="composer-tools"><button type="button" className="tool-button" title="Attach a file (coming soon)" aria-label="Attach a file"><Icon name="paperclip" size={17} /></button><span className="composer-hint">A thoughtful answer is just a message away.</span></div><div className="send-group"><span className="send-hint">↵ to send <span>·</span> ⇧↵ for new line</span><button type="submit" className="send-button" disabled={!draft.trim() || loading || booting} aria-label="Send message"><Icon name="send" size={17} /></button></div></div>
          </form>
          <p className="disclaimer">Xander can make mistakes. Double-check anything important.</p>
        </div>
      </section>
    </main>
  );
}

function CopyIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>; }
function ThumbIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12M15 5.9 14 10h6.8a2 2 0 0 1 2 2.4l-1.4 8a2 2 0 0 1-2 1.6H7V10l5.1-7.2A1.8 1.8 0 0 1 15 5.9ZM3 10h4v12H3z"/></svg>; }
