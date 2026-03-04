"use client";

import { useState, useCallback } from "react";

interface Message {
  role: "agent" | "user";
  content: string;
}

interface UnderstandingResult {
  success: boolean;
  facetsProcessed: number;
  sessionSummary: string;
  themes: string[];
}

export function useUnderstanding() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [result, setResult] = useState<UnderstandingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const extractUnderstanding = useCallback(
    async (
      conversationId: string,
      messages: Message[],
      startedAt: string
    ): Promise<UnderstandingResult | null> => {
      if (messages.length < 2) return null; // Need at least one exchange

      setIsExtracting(true);
      setError(null);

      try {
        const response = await fetch("/api/understanding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            messages,
            startedAt,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to extract understanding");
        }

        const data: UnderstandingResult = await response.json();
        setResult(data);
        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return null;
      } finally {
        setIsExtracting(false);
      }
    },
    []
  );

  return {
    isExtracting,
    result,
    error,
    extractUnderstanding,
  };
}
