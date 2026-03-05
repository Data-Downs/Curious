"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useConversation } from "@/hooks/use-conversation";

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

// --- Inline keyframes for voice-specific animations ---
const rippleKeyframes = `
@keyframes voice-ripple-1 {
  0% { transform: scale(1); opacity: 0.4; }
  100% { transform: scale(1.8); opacity: 0; }
}
@keyframes voice-ripple-2 {
  0% { transform: scale(1); opacity: 0.3; }
  100% { transform: scale(2.2); opacity: 0; }
}
@keyframes voice-ripple-3 {
  0% { transform: scale(1); opacity: 0.2; }
  100% { transform: scale(2.6); opacity: 0; }
}
@keyframes voice-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(161, 133, 101, 0.3); }
  50% { box-shadow: 0 0 40px rgba(161, 133, 101, 0.6); }
}
@keyframes dot-breathe {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.8; }
}
@keyframes word-appear {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

export default function VoiceLabPage() {
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

  // --- State ---
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputValue, setTextInputValue] = useState("");
  const [displayedWords, setDisplayedWords] = useState<string[]>([]);
  const [revealCount, setRevealCount] = useState(0);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);
  const lastQuestionRef = useRef("");
  const wordRevealTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Check speech support on mount ---
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSpeechSupported(false);
      setShowTextInput(true);
    }
  }, []);

  // --- Start conversation on mount ---
  useEffect(() => {
    if (isFirstQuestion) {
      startConversation();
    }
  }, [isFirstQuestion, startConversation]);

  // --- Word-by-word reveal effect ---
  useEffect(() => {
    // When currentQuestion changes and we're still streaming, just track it
    if (isStreaming) {
      lastQuestionRef.current = currentQuestion;
      return;
    }

    // Streaming just finished — start word reveal
    const question = currentQuestion || lastQuestionRef.current;
    if (!question) return;

    const words = question.split(/(\s+)/); // preserve whitespace
    setDisplayedWords(words);
    setRevealCount(0);

    // Clear any existing timer
    if (wordRevealTimerRef.current) {
      clearInterval(wordRevealTimerRef.current);
    }

    let count = 0;
    wordRevealTimerRef.current = setInterval(() => {
      count++;
      setRevealCount(count);
      if (count >= words.length) {
        if (wordRevealTimerRef.current) clearInterval(wordRevealTimerRef.current);
      }
    }, 50);

    return () => {
      if (wordRevealTimerRef.current) clearInterval(wordRevealTimerRef.current);
    };
  }, [currentQuestion, isStreaming]);

  // --- Auto-scroll history ---
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Speech recognition helpers ---
  const startRecognition = useCallback(() => {
    if (!speechSupported || typeof window === "undefined") return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsRecording(true);
      setInterimText("");
      setFinalText("");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setFinalText(final);
      setInterimText(interim);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [speechSupported]);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  // --- Auto-send when recording stops and we have text ---
  useEffect(() => {
    if (!isRecording && (finalText || interimText)) {
      const text = (finalText + " " + interimText).trim();
      if (text) {
        sendMessage(text, "voice");
        setFinalText("");
        setInterimText("");
      }
    }
    // Only trigger on isRecording change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

  // --- Hold-to-speak handlers ---
  const handlePressStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      if (isStreaming || isLoading) return;
      startRecognition();
    },
    [isStreaming, isLoading, startRecognition]
  );

  const handlePressEnd = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      stopRecognition();
    },
    [stopRecognition]
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // --- Text input submit ---
  const handleTextSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const text = textInputValue.trim();
      if (!text || isStreaming) return;
      sendMessage(text, "text");
      setTextInputValue("");
    },
    [textInputValue, isStreaming, sendMessage]
  );

  // --- Determine current state for UI ---
  const isWaitingForQuestion = isStreaming || isLoading;
  const hasTranscription = isRecording && (interimText || finalText);
  const canSpeak = !isWaitingForQuestion && !showTextInput && speechSupported;

  return (
    <>
      {/* Inject animation keyframes */}
      <style dangerouslySetInnerHTML={{ __html: rippleKeyframes }} />

      <div className="flex flex-col h-dvh bg-curious-950 text-curious-100 overflow-hidden select-none pb-14">
        {/* --- Conversation history (top zone) --- */}
        <div className="flex-1 overflow-y-auto px-6 pt-8 pb-4 space-y-4 min-h-0">
          {messages.length === 0 && !currentQuestion && !isLoading && (
            <p className="text-curious-500 text-center font-serif text-sm italic mt-12">
              A space for speaking what matters.
            </p>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-[85%] ${
                msg.role === "user"
                  ? "ml-auto text-right"
                  : "mr-auto text-left"
              }`}
            >
              <p
                className={`font-serif text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "text-curious-300"
                    : "text-curious-400 italic"
                }`}
              >
                {msg.content}
              </p>
              {msg.role === "user" && msg.inputType === "voice" && (
                <span className="text-curious-600 text-xs mt-0.5 inline-block">
                  spoken
                </span>
              )}
            </div>
          ))}
          <div ref={historyEndRef} />
        </div>

        {/* --- Inline reflection --- */}
        {currentReflection && !isStreaming && !isLoading && (
          <div className="flex-shrink-0 px-8 pt-4 pb-1 text-center animate-fade-in-up">
            <p className="font-serif text-sm text-curious-400 italic leading-relaxed max-w-md mx-auto">
              {currentReflection}
            </p>
          </div>
        )}

        {/* --- Question display (center zone) --- */}
        <div className="flex-shrink-0 px-8 py-6 min-h-[120px] flex items-center justify-center">
          {isLoading && !currentQuestion ? (
            /* Breathing dots while waiting for first token */
            <div className="flex gap-2 items-center justify-center">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-curious-500"
                  style={{
                    animation: `dot-breathe 1.5s ease-in-out infinite`,
                    animationDelay: `${i * 0.3}s`,
                  }}
                />
              ))}
            </div>
          ) : isStreaming ? (
            /* Show blinking cursor while streaming */
            <div className="text-center">
              <span className="font-serif text-lg text-curious-200 italic">
                <span className="inline-block w-[2px] h-5 bg-curious-400 animate-gentle-pulse align-middle" />
              </span>
            </div>
          ) : displayedWords.length > 0 ? (
            /* Word-by-word reveal */
            <p className="font-serif text-lg md:text-xl text-curious-100 text-center leading-relaxed italic">
              {displayedWords.map((word, i) => (
                <span
                  key={i}
                  style={{
                    opacity: i < revealCount ? 1 : 0,
                    transform: i < revealCount ? "translateY(0)" : "translateY(4px)",
                    transition: "opacity 0.15s ease, transform 0.15s ease",
                    display: "inline",
                  }}
                >
                  {word}
                </span>
              ))}
            </p>
          ) : null}
        </div>

        {/* --- Live transcription display --- */}
        {hasTranscription && (
          <div className="px-8 pb-2 text-center animate-fade-in-up">
            <p className="font-serif text-sm text-curious-300">
              {finalText}
              {interimText && (
                <span className="text-curious-500">{" "}{interimText}</span>
              )}
            </p>
          </div>
        )}

        {/* --- Bottom interaction zone --- */}
        <div className="flex-shrink-0 pb-10 pt-4 px-6">
          {showTextInput ? (
            /* Text input mode */
            <div className="space-y-3">
              <form onSubmit={handleTextSubmit} className="flex gap-3">
                <input
                  type="text"
                  value={textInputValue}
                  onChange={(e) => setTextInputValue(e.target.value)}
                  placeholder="Type your response..."
                  disabled={isWaitingForQuestion}
                  className="flex-1 bg-curious-900/60 border border-curious-700/50 rounded-full px-5 py-3 font-serif text-sm text-curious-100 placeholder-curious-600 focus:outline-none focus:border-curious-500 disabled:opacity-40"
                />
                <button
                  type="submit"
                  disabled={isWaitingForQuestion || !textInputValue.trim()}
                  className="bg-curious-700/60 text-curious-200 rounded-full px-5 py-3 font-serif text-sm hover:bg-curious-600/60 disabled:opacity-30 transition-colors"
                >
                  Send
                </button>
              </form>
              {speechSupported && (
                <button
                  onClick={() => setShowTextInput(false)}
                  className="block mx-auto text-curious-600 text-xs hover:text-curious-400 transition-colors"
                >
                  Switch to voice
                </button>
              )}
            </div>
          ) : (
            /* Voice mode */
            <div className="flex flex-col items-center gap-4">
              {/* Mic button with ripples */}
              <div className="relative flex items-center justify-center">
                {/* Ripple rings (visible when recording) */}
                {isRecording && (
                  <>
                    <span
                      className="absolute w-24 h-24 rounded-full border border-curious-500/40"
                      style={{ animation: "voice-ripple-1 1.5s ease-out infinite" }}
                    />
                    <span
                      className="absolute w-24 h-24 rounded-full border border-curious-500/30"
                      style={{ animation: "voice-ripple-2 1.5s ease-out infinite 0.3s" }}
                    />
                    <span
                      className="absolute w-24 h-24 rounded-full border border-curious-500/20"
                      style={{ animation: "voice-ripple-3 1.5s ease-out infinite 0.6s" }}
                    />
                  </>
                )}

                {/* Main mic circle */}
                <button
                  onMouseDown={canSpeak ? handlePressStart : undefined}
                  onMouseUp={canSpeak ? handlePressEnd : undefined}
                  onMouseLeave={isRecording ? handlePressEnd : undefined}
                  onTouchStart={canSpeak ? handlePressStart : undefined}
                  onTouchEnd={canSpeak ? handlePressEnd : undefined}
                  onContextMenu={handleContextMenu}
                  disabled={!canSpeak}
                  className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isRecording
                      ? "bg-curious-600 scale-110"
                      : isWaitingForQuestion
                      ? "bg-curious-800/40 cursor-not-allowed"
                      : "bg-curious-800/80 hover:bg-curious-700/80 active:scale-95"
                  }`}
                  style={
                    isRecording
                      ? { animation: "voice-glow 1.5s ease-in-out infinite" }
                      : undefined
                  }
                  aria-label={isRecording ? "Release to send" : "Hold to speak"}
                >
                  {/* Microphone icon */}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`w-10 h-10 transition-colors ${
                      isRecording
                        ? "text-curious-100"
                        : isWaitingForQuestion
                        ? "text-curious-600"
                        : "text-curious-300"
                    }`}
                  >
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                  </svg>
                </button>
              </div>

              {/* Status label */}
              <p className="text-curious-500 text-xs font-serif">
                {isRecording
                  ? "Listening..."
                  : isWaitingForQuestion
                  ? "Thinking..."
                  : "Hold to speak"}
              </p>

              {/* Keyboard toggle */}
              <button
                onClick={() => setShowTextInput(true)}
                className="text-curious-600 hover:text-curious-400 transition-colors"
                aria-label="Switch to text input"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <rect x="2" y="4" width="20" height="14" rx="2" />
                  <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01" />
                  <path d="M6 12h.01M10 12h.01M14 12h.01M18 12h.01" />
                  <path d="M8 16h8" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* --- Speech not supported banner --- */}
        {!speechSupported && (
          <div className="absolute top-4 left-4 right-4 bg-curious-900/90 border border-curious-700/50 rounded-lg px-4 py-3 text-center">
            <p className="text-curious-400 text-xs font-serif">
              Voice input is not supported in this browser. Using text mode.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
