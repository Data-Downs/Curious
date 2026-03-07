"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./message-bubble";
import { QuestionDisplay } from "./question-display";

interface Message {
  id: string;
  role: "agent" | "user";
  content: string;
  inputType?: "text" | "voice" | "photo" | "url";
}

interface ConversationViewProps {
  messages: Message[];
  currentQuestion: string;
  currentReflection?: string;
  isStreaming: boolean;
  isLoading: boolean;
}

export function ConversationView({
  messages,
  currentQuestion,
  currentReflection,
  isStreaming,
  isLoading,
}: ConversationViewProps) {
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [messages]);

  // Loading state — breathing dots
  if (messages.length === 0 && isLoading && !currentQuestion) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2">
            <span className="block w-1.5 h-1.5 rounded-full bg-curious-400 animate-breathe" />
            <span className="block w-1.5 h-1.5 rounded-full bg-curious-400 animate-breathe" style={{ animationDelay: "0.4s" }} />
            <span className="block w-1.5 h-1.5 rounded-full bg-curious-400 animate-breathe" style={{ animationDelay: "0.8s" }} />
          </div>
          <p className="text-sm text-curious-500 font-serif italic">
            Considering...
          </p>
        </div>
      </div>
    );
  }

  // First question — no history yet
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <QuestionDisplay key="q-first" question={currentQuestion} reflection={currentReflection} isStreaming={isStreaming} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* History zone — past messages, scrollable */}
      <div
        ref={historyRef}
        className="relative flex-1 overflow-y-auto min-h-0"
      >
        <div className="px-2 py-2">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
              inputType={msg.inputType}
            />
          ))}
        </div>
        {/* Gradient fade at bottom edge */}
        <div className="sticky bottom-0 h-8 bg-gradient-to-t from-curious-50 to-transparent pointer-events-none" />
      </div>

      {/* Presence zone — current question */}
      <div className="shrink-0 flex items-center justify-center py-4">
        {isLoading && !currentQuestion ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              <span className="block w-1.5 h-1.5 rounded-full bg-curious-400 animate-breathe" />
              <span className="block w-1.5 h-1.5 rounded-full bg-curious-400 animate-breathe" style={{ animationDelay: "0.4s" }} />
              <span className="block w-1.5 h-1.5 rounded-full bg-curious-400 animate-breathe" style={{ animationDelay: "0.8s" }} />
            </div>
            <p className="text-sm text-curious-500 font-serif italic">
              Considering...
            </p>
          </div>
        ) : currentQuestion ? (
          <QuestionDisplay key={`q-${messages.length}`} question={currentQuestion} reflection={currentReflection} isStreaming={isStreaming} />
        ) : null}
      </div>
    </div>
  );
}
