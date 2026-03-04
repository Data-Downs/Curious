"use client";

import { useState } from "react";

interface BridgeQueryProps {
  connectionId: string;
}

interface QueryResult {
  response: string;
  tier: string;
}

export function BridgeQuery({ connectionId }: BridgeQueryProps) {
  const [query, setQuery] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setIsQuerying(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/bridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, query: query.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to query");
        return;
      }

      setResult(data);
      setQuery("");
    } catch {
      setError("Something went wrong");
    } finally {
      setIsQuerying(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about this person..."
          disabled={isQuerying}
          className="flex-1 rounded-lg border border-curious-200 bg-white px-4 py-3 text-curious-900 placeholder:text-curious-400 focus:border-curious-500 focus:outline-none focus:ring-1 focus:ring-curious-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isQuerying || !query.trim()}
          className="rounded-lg bg-curious-800 px-5 py-3 text-white font-medium hover:bg-curious-700 transition-colors disabled:opacity-50"
        >
          {isQuerying ? "..." : "Ask"}
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {isQuerying && (
        <div className="flex items-center gap-3 py-4">
          <div className="flex gap-1.5">
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
            Consulting their agent...
          </p>
        </div>
      )}

      {result && (
        <div className="bg-white/60 rounded-2xl px-6 py-6 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-curious-400 bg-curious-100/60 rounded-full px-2 py-0.5">
              {result.tier} access
            </span>
          </div>
          <p className="text-base font-serif text-curious-700 leading-relaxed whitespace-pre-line">
            {result.response}
          </p>
        </div>
      )}
    </div>
  );
}
