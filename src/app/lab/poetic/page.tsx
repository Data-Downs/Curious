"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useConversation } from "@/hooks/use-conversation";

type Phase =
  | "idle"
  | "reflection"
  | "question-reveal"
  | "awaiting-input"
  | "dissolving"
  | "breathing"
  | "starting";

export default function PoeticPage() {
  const {
    currentQuestion,
    currentReflection,
    isStreaming,
    isFirstQuestion,
    startConversation,
    sendMessage,
  } = useConversation();

  const [phase, setPhase] = useState<Phase>("starting");
  const [bufferedQuestion, setBufferedQuestion] = useState("");
  const [bufferedReflection, setBufferedReflection] = useState("");
  const [visibleWords, setVisibleWords] = useState(0);
  const [reflectionVisibleWords, setReflectionVisibleWords] = useState(0);
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [dissolving, setDissolving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const revealIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasStartedRef = useRef(false);

  // Start the conversation on mount
  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      startConversation();
    }
  }, [startConversation]);

  // Buffer the question once streaming completes
  useEffect(() => {
    if (!isStreaming && currentQuestion && phase !== "dissolving") {
      if (currentReflection && phase !== "question-reveal") {
        setBufferedReflection(currentReflection);
        setBufferedQuestion(currentQuestion);
        setPhase("reflection");
      } else if (phase !== "reflection") {
        setBufferedQuestion(currentQuestion);
        setPhase("question-reveal");
      }
    }
  }, [isStreaming, currentQuestion, currentReflection, phase]);

  // Reflection word-by-word reveal
  useEffect(() => {
    if (phase !== "reflection" || !bufferedReflection) return;

    const words = bufferedReflection.split(/\s+/);
    let i = 0;
    setReflectionVisibleWords(0);

    const interval = setInterval(() => {
      i++;
      setReflectionVisibleWords(i);
      if (i >= words.length) {
        clearInterval(interval);
        // Hold the reflection for 2s, then transition to question
        setTimeout(() => {
          setPhase("question-reveal");
        }, 2000);
      }
    }, 400); // Even slower for reflections

    return () => clearInterval(interval);
  }, [phase, bufferedReflection]);

  // Question word-by-word reveal
  useEffect(() => {
    if (phase !== "question-reveal" || !bufferedQuestion) return;

    const words = bufferedQuestion.split(/\s+/);
    let i = 0;
    setVisibleWords(0);
    setShowInput(false);

    revealIntervalRef.current = setInterval(() => {
      i++;
      setVisibleWords(i);
      if (i >= words.length) {
        if (revealIntervalRef.current) clearInterval(revealIntervalRef.current);
        revealIntervalRef.current = null;
        setTimeout(() => {
          setShowInput(true);
          setPhase("awaiting-input");
        }, 1500);
      }
    }, 300);

    return () => {
      if (revealIntervalRef.current) {
        clearInterval(revealIntervalRef.current);
        revealIntervalRef.current = null;
      }
    };
  }, [phase, bufferedQuestion]);

  // Auto-focus input when it appears
  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim()) return;
    const text = inputValue.trim();
    setInputValue("");
    setDissolving(true);

    // After dissolve animation, clear state and send
    setTimeout(() => {
      setDissolving(false);
      setShowInput(false);
      setVisibleWords(0);
      setReflectionVisibleWords(0);
      setBufferedQuestion("");
      setBufferedReflection("");
      setPhase("breathing");

      sendMessage(text, "text");
    }, 600);
  }, [inputValue, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  // Render helpers
  const questionWords = bufferedQuestion.split(/\s+/).filter(Boolean);
  const reflectionWords = bufferedReflection.split(/\s+/).filter(Boolean);

  const isWaiting =
    phase === "starting" ||
    phase === "breathing" ||
    (isStreaming && phase !== "question-reveal" && phase !== "reflection");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
      className="bg-curious-50 pb-14"
    >
      <div
        style={{
          maxWidth: "36rem",
          width: "100%",
          textAlign: "center",
          transition: "opacity 0.6s ease",
          opacity: dissolving ? 0 : 1,
        }}
      >
        {/* Breathing dots — waiting state */}
        {isWaiting && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "0.75rem",
            }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="bg-curious-300"
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  animation: "breathe 3s ease-in-out infinite",
                  animationDelay: `${i * 0.4}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Reflection reveal */}
        {phase === "reflection" && reflectionWords.length > 0 && (
          <p
            className="font-serif text-curious-500"
            style={{
              fontSize: "1.125rem",
              lineHeight: "1.9",
              letterSpacing: "0.01em",
              fontStyle: "italic",
            }}
          >
            {reflectionWords.map((word, i) => (
              <span
                key={`r-${i}`}
                style={{
                  opacity: i < reflectionVisibleWords ? 1 : 0,
                  transition: "opacity 0.5s ease",
                  marginRight: "0.3em",
                  display: "inline-block",
                }}
              >
                {word}
              </span>
            ))}
          </p>
        )}

        {/* Question reveal */}
        {(phase === "question-reveal" || phase === "awaiting-input") &&
          questionWords.length > 0 && (
            <p
              className="font-serif text-curious-900"
              style={{
                fontSize: "1.375rem",
                lineHeight: "1.8",
                letterSpacing: "0.01em",
              }}
            >
              {questionWords.map((word, i) => (
                <span
                  key={`q-${i}`}
                  style={{
                    opacity: i < visibleWords ? 1 : 0,
                    transition: "opacity 0.45s ease",
                    marginRight: "0.3em",
                    display: "inline-block",
                  }}
                >
                  {word}
                </span>
              ))}
            </p>
          )}

        {/* Input */}
        {showInput && (
          <div
            style={{
              marginTop: "2.5rem",
              opacity: showInput ? 1 : 0,
              transition: "opacity 0.8s ease",
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="..."
              className="font-serif text-curious-700 placeholder:text-curious-300"
              style={{
                width: "100%",
                fontSize: "1.125rem",
                textAlign: "center",
                background: "transparent",
                border: "none",
                outline: "none",
                fontStyle: "italic",
                letterSpacing: "0.01em",
                caretColor: "var(--color-curious-400)",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
