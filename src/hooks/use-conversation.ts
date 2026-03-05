"use client";

import { useState, useCallback, useRef } from "react";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";

interface Message {
  id: string;
  role: "agent" | "user";
  content: string;
  inputType: "text" | "voice" | "photo" | "url";
}

export function useConversation() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentReflection, setCurrentReflection] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId] = useState(() => nanoid());
  const [isFirstQuestion, setIsFirstQuestion] = useState(true);
  const hasStartedRef = useRef(false);
  const startedAtRef = useRef(new Date().toISOString());
  const extractingRef = useRef(false);

  // Parse SSE data events, handling both typed and legacy formats
  const parseSSEData = (data: { type?: string; text?: string }) => {
    if (data.type === "reflection") {
      setCurrentReflection(data.text ?? "");
    } else if (data.type === "question") {
      // For question events, append text (streaming) or set full text (buffered reflection turn)
      setCurrentQuestion((prev) => prev + (data.text ?? ""));
    } else if (data.text) {
      // Legacy format without type — treat as question
      setCurrentQuestion((prev) => prev + data.text);
    }
  };

  // Save a message to IndexedDB
  const saveMessageLocally = useCallback(
    async (msg: Message) => {
      try {
        await db.messages.put({
          id: msg.id,
          conversationId,
          role: msg.role,
          content: msg.content,
          inputType: msg.inputType,
          timestamp: new Date(),
        });
        const existing = await db.conversations.get(conversationId);
        if (existing) {
          await db.conversations.update(conversationId, {
            lastMessageAt: new Date(),
            messageCount: existing.messageCount + 1,
          });
        } else {
          await db.conversations.put({
            id: conversationId,
            startedAt: new Date(),
            lastMessageAt: new Date(),
            messageCount: 1,
          });
        }
      } catch {
        // IndexedDB errors shouldn't break the conversation
      }
    },
    [conversationId]
  );

  // Background understanding extraction — fire and forget
  const extractInBackground = useCallback(
    (allMessages: Message[]) => {
      if (extractingRef.current || allMessages.length < 4) return;
      extractingRef.current = true;

      const transcript = allMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      fetch("/api/understanding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          messages: transcript,
          startedAt: startedAtRef.current,
        }),
      })
        .catch(() => {})
        .finally(() => {
          extractingRef.current = false;
        });
    },
    [conversationId]
  );

  // Process an SSE stream response
  const processStream = useCallback(
    async (response: Response) => {
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const data = JSON.parse(line.slice(6));
              parseSSEData(data);
              setIsLoading(false);
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Fetch the first question
  const startConversation = useCallback(async () => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    startedAtRef.current = new Date().toISOString();

    setIsStreaming(true);
    setIsLoading(true);
    setCurrentQuestion("");
    setCurrentReflection("");

    try {
      const response = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "[Returning to continue our conversation — ask a question that builds on what you already know about me]",
          inputType: "text",
          conversationId,
        }),
      });

      if (!response.ok) throw new Error("Failed to start conversation");

      await processStream(response);

      setIsFirstQuestion(false);
    } catch {
      setCurrentQuestion("What's on your mind today?");
      setIsFirstQuestion(false);
    } finally {
      setIsStreaming(false);
      setIsLoading(false);
    }
  }, [conversationId, processStream]);

  // Send a message and get the next question
  const sendMessage = useCallback(
    async (text: string, inputType: "text" | "voice" | "photo" | "url") => {
      const userMessage: Message = {
        id: nanoid(),
        role: "user",
        content: text,
        inputType,
      };

      const agentMessage: Message = {
        id: nanoid(),
        role: "agent",
        content: currentQuestion,
        inputType: "text",
      };

      const updatedMessages = [...messages, agentMessage, userMessage];
      setMessages(updatedMessages);
      setCurrentQuestion("");
      setCurrentReflection("");
      setIsStreaming(true);

      // Save to IndexedDB
      saveMessageLocally(agentMessage);
      saveMessageLocally(userMessage);

      // Extract understanding in background (fire and forget)
      extractInBackground(updatedMessages);

      try {
        const recentMessages = updatedMessages.slice(-20).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await fetch("/api/conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            inputType,
            conversationId,
            recentMessages,
          }),
        });

        if (!response.ok) throw new Error("Failed to send message");

        await processStream(response);
      } catch {
        setCurrentQuestion("Tell me more about that...");
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, currentQuestion, conversationId, saveMessageLocally, extractInBackground, processStream]
  );

  return {
    messages,
    currentQuestion,
    currentReflection,
    isStreaming,
    isLoading,
    isFirstQuestion,
    conversationId,
    startConversation,
    sendMessage,
  };
}
