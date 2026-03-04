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
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId] = useState(() => nanoid());
  const [isFirstQuestion, setIsFirstQuestion] = useState(true);
  const hasStartedRef = useRef(false);
  const startedAtRef = useRef(new Date().toISOString());
  const extractingRef = useRef(false);

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

  // Fetch the first question
  const startConversation = useCallback(async () => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    startedAtRef.current = new Date().toISOString();

    setIsStreaming(true);
    setIsLoading(true);
    setCurrentQuestion("");

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

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let question = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                question += data.text;
                setCurrentQuestion(question);
                setIsLoading(false);
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      setIsFirstQuestion(false);
    } catch {
      setCurrentQuestion("What's on your mind today?");
      setIsFirstQuestion(false);
    } finally {
      setIsStreaming(false);
      setIsLoading(false);
    }
  }, [conversationId]);

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

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let question = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.text) {
                  question += data.text;
                  setCurrentQuestion(question);
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }
      } catch {
        setCurrentQuestion("Tell me more about that...");
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, currentQuestion, conversationId, saveMessageLocally, extractInBackground]
  );

  return {
    messages,
    currentQuestion,
    isStreaming,
    isLoading,
    isFirstQuestion,
    conversationId,
    startConversation,
    sendMessage,
  };
}
