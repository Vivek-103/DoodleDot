"use client";

import { useRef, useEffect, useState, FormEvent } from "react";

export interface ChatEntry {
  id: string;
  type: "chat" | "correct_guess" | "system";
  userId?: string;
  username?: string;
  message?: string;
}

interface Props {
  messages: ChatEntry[];
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function GameChat({ messages, onSend, disabled, placeholder }: Props) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput("");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {messages.map((msg) => {
          if (msg.type === "system") {
            return (
              <div
                key={msg.id}
                style={{
                  textAlign: "center",
                  fontSize: "0.8rem",
                  color: "var(--text-soft)",
                  padding: "4px 0",
                  fontStyle: "italic",
                }}
              >
                {msg.message}
              </div>
            );
          }
          if (msg.type === "correct_guess") {
            return (
              <div
                key={msg.id}
                style={{
                  textAlign: "center",
                  background: "rgba(78, 205, 196, 0.12)",
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--teal)",
                }}
              >
                {msg.username} guessed correctly!
              </div>
            );
          }
          return (
            <div key={msg.id} style={{ fontSize: "0.88rem", lineHeight: 1.5 }}>
              <strong style={{ color: "var(--charcoal)" }}>{msg.username}</strong>
              <span style={{ color: "var(--text-soft)", marginLeft: 6 }}>{msg.message}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          gap: 8,
          padding: "8px 0",
          borderTop: "1px solid var(--cream-dark)",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={disabled ? "You are drawing — no guessing!" : placeholder || "Type your guess..."}
          disabled={disabled}
          maxLength={100}
          style={{
            flex: 1,
            padding: "10px 14px",
            border: "2px solid var(--cream-dark)",
            borderRadius: 12,
            fontFamily: "var(--font-outfit)",
            fontSize: "0.9rem",
            color: "var(--charcoal)",
            background: "var(--cream)",
          }}
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          style={{
            padding: "10px 20px",
            borderRadius: 12,
            border: "none",
            background: disabled || !input.trim() ? "var(--cream-dark)" : "var(--coral)",
            color: disabled || !input.trim() ? "var(--text-soft)" : "white",
            fontFamily: "var(--font-fredoka)",
            fontWeight: 500,
            cursor: disabled || !input.trim() ? "default" : "pointer",
            transition: "background 0.2s",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
