"use client";

import { useState, useRef, useEffect } from "react";

interface TextInputProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function TextInput({ onSubmit, disabled, placeholder }: TextInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    }
  }, [text]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setText("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? "Share your thoughts..."}
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-2xl border border-curious-200 bg-white px-4 py-3 text-curious-900 placeholder:text-curious-400 focus:border-curious-500 focus:outline-none focus:ring-1 focus:ring-curious-500 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="rounded-full bg-curious-800 p-3 text-white transition-colors hover:bg-curious-700 disabled:opacity-30 disabled:hover:bg-curious-800"
        aria-label="Send"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </form>
  );
}
