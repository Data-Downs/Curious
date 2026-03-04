"use client";

import { useState } from "react";
import type { Reflection } from "@/lib/types";

interface RequestReflectionButtonProps {
  onReflectionGenerated: (reflection: Reflection) => void;
}

export function RequestReflectionButton({
  onReflectionGenerated,
}: RequestReflectionButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRequest() {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/reflections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      onReflectionGenerated(data.reflection);
    } catch {
      setError("Failed to generate reflection");
    } finally {
      setIsGenerating(false);
    }
  }

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="flex gap-2">
          <span className="block w-1.5 h-1.5 rounded-full bg-curious-400 animate-breathe" />
          <span
            className="block w-1.5 h-1.5 rounded-full bg-curious-400 animate-breathe"
            style={{ animationDelay: "0.4s" }}
          />
          <span
            className="block w-1.5 h-1.5 rounded-full bg-curious-400 animate-breathe"
            style={{ animationDelay: "0.8s" }}
          />
        </div>
        <p className="text-sm text-curious-500 font-serif italic">
          Reflecting...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleRequest}
        className="rounded-full bg-curious-800 px-6 py-3 text-white font-medium hover:bg-curious-700 transition-colors"
      >
        Request a reflection
      </button>
      {error && (
        <p className="text-sm text-curious-500 font-serif italic text-center">
          {error}
        </p>
      )}
    </div>
  );
}
