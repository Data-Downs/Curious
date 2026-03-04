"use client";

import { useState, useCallback } from "react";
import { nanoid } from "nanoid";

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
  const [conversationId] = useState(() => nanoid());
  const [isFirstQuestion, setIsFirstQuestion] = useState(true);

  // Fetch the first question when the conversation starts
  const startConversation = useCallback(async () => {
    setIsStreaming(true);
    setCurrentQuestion("");

    try {
      const response = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "[First interaction — ask an opening question]",
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
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      setIsFirstQuestion(false);
    } catch (err) {
      setCurrentQuestion("What's on your mind today?");
      setIsFirstQuestion(false);
    } finally {
      setIsStreaming(false);
    }
  }, [conversationId]);

  // Send a message and get the next question
  const sendMessage = useCallback(
    async (text: string, inputType: "text" | "voice" | "photo" | "url") => {
      // Add the user's message to the conversation
      const userMessage: Message = {
        id: nanoid(),
        role: "user",
        content: text,
        inputType,
      };

      // Move current question to messages as an agent message
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

      try {
        // Send recent messages for context (last 10 exchanges)
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
      } catch (err) {
        setCurrentQuestion("Tell me more about that...");
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, currentQuestion, conversationId]
  );

  return {
    messages,
    currentQuestion,
    isStreaming,
    isFirstQuestion,
    conversationId,
    startConversation,
    sendMessage,
  };
}
