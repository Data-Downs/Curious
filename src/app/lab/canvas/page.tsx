"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useConversation } from "@/hooks/use-conversation";

interface RevealedWord {
  text: string;
  visible: boolean;
}

interface PastExchange {
  question: string;
  answer: string;
  opacity: number;
}

export default function CanvasPage() {
  const {
    messages,
    currentQuestion,
    currentReflection,
    isStreaming,
    isLoading,
    isFirstQuestion,
    startConversation,
    sendMessage,
  } = useConversation();

  // Word-by-word reveal state
  const [revealedWords, setRevealedWords] = useState<RevealedWord[]>([]);
  const [revealComplete, setRevealComplete] = useState(false);
  const [lastRevealedQuestion, setLastRevealedQuestion] = useState("");

  // User input state
  const [userText, setUserText] = useState("");
  const [hasStartedTyping, setHasStartedTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Past exchanges
  const [pastExchanges, setPastExchanges] = useState<PastExchange[]>([]);

  // Start conversation on mount
  useEffect(() => {
    if (isFirstQuestion) {
      startConversation();
    }
  }, [isFirstQuestion, startConversation]);

  // Word-by-word reveal effect
  useEffect(() => {
    // Only trigger reveal when streaming finishes and we have a new question
    if (isStreaming || !currentQuestion || currentQuestion === lastRevealedQuestion) {
      return;
    }

    setLastRevealedQuestion(currentQuestion);
    setRevealComplete(false);
    setHasStartedTyping(false);
    setUserText("");

    const words = currentQuestion.split(/(\s+)/).filter((w) => w.trim().length > 0);
    const initialWords: RevealedWord[] = words.map((w) => ({ text: w, visible: false }));
    setRevealedWords(initialWords);

    // Reveal each word with a delay
    words.forEach((_, i) => {
      setTimeout(() => {
        setRevealedWords((prev) => {
          const next = [...prev];
          if (next[i]) {
            next[i] = { ...next[i], visible: true };
          }
          return next;
        });

        // Mark reveal complete after last word
        if (i === words.length - 1) {
          setTimeout(() => {
            setRevealComplete(true);
            // Focus the hidden textarea
            textareaRef.current?.focus();
          }, 200);
        }
      }, (i + 1) * 120);
    });
  }, [currentQuestion, isStreaming, lastRevealedQuestion]);

  // Keep focus on textarea when page is clicked
  const handlePageClick = useCallback(() => {
    if (revealComplete && !isSending) {
      textareaRef.current?.focus();
    }
  }, [revealComplete, isSending]);

  // Handle textarea changes
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserText(e.target.value);
    if (!hasStartedTyping && e.target.value.length > 0) {
      setHasStartedTyping(true);
    }
    if (e.target.value.length === 0) {
      setHasStartedTyping(false);
    }
  };

  // Handle key events on textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Send the message
  const handleSend = async () => {
    const text = userText.trim();
    if (!text || isSending) return;

    setIsSending(true);

    // Archive current exchange
    setPastExchanges((prev) => {
      const updated = [
        ...prev,
        { question: currentQuestion, answer: text, opacity: 0.35 },
      ];
      // Fade older exchanges further
      return updated.map((ex, i) => ({
        ...ex,
        opacity: Math.max(0.08, 0.35 - (updated.length - 1 - i) * 0.09),
      }));
    });

    setUserText("");
    setHasStartedTyping(false);
    setRevealedWords([]);
    setRevealComplete(false);

    await sendMessage(text, "text");
    setIsSending(false);
  };

  // Breathing dots while waiting
  const BreathingDots = () => (
    <div className="flex items-center justify-center gap-2 py-12">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block h-1.5 w-1.5 rounded-full bg-curious-400"
          style={{
            animation: "breathe 3s ease-in-out infinite",
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}
    </div>
  );

  const isWaiting = isLoading || (isStreaming && !currentQuestion) || isSending;
  const showQuestion = !isWaiting && revealedWords.length > 0;
  const showInput = revealComplete && !isSending;

  return (
    <div
      className="fixed inset-0 flex flex-col items-center bg-curious-50 overflow-hidden cursor-text pb-14"
      onClick={handlePageClick}
    >
      {/* Scrollable content area */}
      <div className="flex flex-col items-center justify-center flex-1 w-full max-w-2xl px-6 pb-8 overflow-hidden">
        {/* Past exchanges — faded history */}
        {pastExchanges.length > 0 && (
          <div className="w-full mb-8 space-y-6 overflow-hidden">
            {pastExchanges.map((ex, i) => (
              <div
                key={i}
                className="space-y-2 transition-opacity duration-1000"
                style={{ opacity: ex.opacity }}
              >
                <p className="font-serif text-sm text-curious-700 leading-relaxed">
                  {ex.question}
                </p>
                <p className="font-serif text-sm text-curious-500 font-light leading-relaxed pl-4">
                  {ex.answer}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Inline reflection — appears as a gentle preamble before the question */}
        {currentReflection && !isWaiting && (
          <p
            className="font-serif text-sm text-curious-400 italic text-center mb-4 max-w-md leading-relaxed animate-fade-in-up"
          >
            {currentReflection}
          </p>
        )}

        {/* Waiting state */}
        {isWaiting && <BreathingDots />}

        {/* Question — word by word reveal */}
        {showQuestion && (
          <div className="w-full text-center mb-8">
            <p className="font-serif text-xl sm:text-2xl text-curious-900 leading-relaxed tracking-tight">
              {revealedWords.map((word, i) => (
                <span
                  key={i}
                  className="inline-block mr-[0.3em] transition-all duration-500"
                  style={{
                    opacity: word.visible ? 1 : 0,
                    transform: word.visible ? "translateY(0)" : "translateY(8px)",
                    filter: word.visible ? "blur(0)" : "blur(2px)",
                  }}
                >
                  {word.text}
                </span>
              ))}
            </p>
          </div>
        )}

        {/* User text display area — the "writing on the page" */}
        {showInput && (
          <div className="w-full min-h-[80px] relative">
            {/* Ghost prompt */}
            {!hasStartedTyping && (
              <p
                className="font-serif text-lg text-curious-300 text-center pointer-events-none select-none"
                style={{
                  animation: "breathe 3s ease-in-out infinite",
                }}
              >
                What comes to mind...
              </p>
            )}

            {/* Visible user text — mirrors the hidden textarea */}
            {hasStartedTyping && (
              <div className="font-serif text-lg sm:text-xl text-curious-700 font-light leading-relaxed text-center whitespace-pre-wrap break-words">
                {userText}
                <span
                  className="inline-block w-[2px] h-[1.1em] bg-curious-400 ml-0.5 align-text-bottom"
                  style={{
                    animation: "blink 1s steps(1) infinite",
                  }}
                />
              </div>
            )}

            {/* Blinking cursor when waiting to type */}
            {!hasStartedTyping && (
              <div className="flex justify-center mt-2">
                <span
                  className="inline-block w-[2px] h-5 bg-curious-400"
                  style={{
                    animation: "blink 1s steps(1) infinite",
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Send hint */}
      {hasStartedTyping && userText.trim().length > 0 && (
        <div className="pb-4 animate-fade-in-up">
          <p className="font-sans text-[10px] text-curious-300 tracking-widest uppercase">
            press enter to send
          </p>
        </div>
      )}

      {/* Hidden textarea — positioned for mobile keyboard trigger */}
      <textarea
        ref={textareaRef}
        value={userText}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        autoFocus
        aria-label="Your response"
        className="fixed bottom-0 left-0 w-full h-12 opacity-0 pointer-events-auto text-base z-[-1]"
        style={{
          // Keep it in the viewport so mobile browsers show the keyboard
          // but invisible to the user
          caretColor: "transparent",
          resize: "none",
        }}
      />

      {/* Blink keyframe — injected inline since it's canvas-specific */}
      <style jsx>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
