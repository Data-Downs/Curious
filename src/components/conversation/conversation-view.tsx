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
  isStreaming: boolean;
}

export function ConversationView({
  messages,
  currentQuestion,
  isStreaming,
}: ConversationViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentQuestion]);

  // If no messages yet, show just the current question prominently
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <QuestionDisplay question={currentQuestion} isStreaming={isStreaming} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-4">
      {/* Past messages */}
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          role={msg.role}
          content={msg.content}
          inputType={msg.inputType}
        />
      ))}

      {/* Current question from the agent */}
      {currentQuestion && (
        <QuestionDisplay question={currentQuestion} isStreaming={isStreaming} />
      )}

      <div ref={bottomRef} />
    </div>
  );
}
