import { useState, useRef, useEffect } from "react";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I'm the GHT Trail Assistant. Ask me about trail conditions, flights, permits, weather, or anything about trekking in Nepal.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.answer,
          sources: data.sources,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        className="chat-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open AI trail assistant"}
      >
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <path d="M8 10h.01M12 10h.01M16 10h.01" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="chat-panel" role="dialog" aria-label="AI Trail Assistant">
          {/* Prayer-flag accent stripe */}
          <div className="chat-prayer-stripe" aria-hidden="true">
            <span /><span /><span /><span /><span />
          </div>
          <div className="chat-header">
            <div className="chat-header-left">
              <span className="chat-header-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 20l4-8 4 6 4-10 6 12" />
                  <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" />
                </svg>
              </span>
              <div className="chat-header-text">
                <span className="chat-header-title">GHT Trail Assistant</span>
                <span className="chat-header-status">Online — Ask anything</span>
              </div>
            </div>
            <button className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg chat-msg-${msg.role}`}>
                {msg.role === "assistant" && (
                  <span className="chat-avatar" aria-hidden="true">🏔️</span>
                )}
                <div className="chat-bubble">
                  <p>{msg.text}</p>
                  {msg.sources && msg.sources.length > 0 && (
                    <details className="chat-sources">
                      <summary>📎 Sources ({msg.sources.length})</summary>
                      <ul>
                        {msg.sources.map((s, j) => (
                          <li key={j}>{s.text}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-msg chat-msg-assistant">
                <span className="chat-avatar" aria-hidden="true">🏔️</span>
                <div className="chat-bubble chat-loading">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-form" onSubmit={handleSend}>
            <input
              type="text"
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about trails, permits, weather..."
              disabled={loading}
              maxLength={500}
              autoFocus
            />
            <button type="submit" className="chat-send" disabled={loading || !input.trim()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
