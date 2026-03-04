"use client";

import { useEffect } from "react";
import { useConversation } from "@/hooks/use-conversation";
import { ConversationView } from "@/components/conversation/conversation-view";
import { InputBar } from "@/components/input/input-bar";

export default function ConversationPage() {
  const {
    messages,
    currentQuestion,
    isStreaming,
    isLoading,
    isFirstQuestion,
    startConversation,
    sendMessage,
  } = useConversation();

  useEffect(() => {
    if (isFirstQuestion) {
      startConversation();
    }
  }, [isFirstQuestion, startConversation]);

  return (
    <div className="flex flex-col h-dvh bg-curious-50 overflow-hidden pb-14">
      <ConversationView
        messages={messages}
        currentQuestion={currentQuestion}
        isStreaming={isStreaming}
        isLoading={isLoading}
      />

      <InputBar
        onSubmit={sendMessage}
        disabled={isStreaming || !currentQuestion}
      />
    </div>
  );
}
