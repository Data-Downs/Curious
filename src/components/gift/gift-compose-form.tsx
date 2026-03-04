"use client";

import { useState } from "react";

interface GiftComposeFormProps {
  onGiftCreated: (inviteUrl: string) => void;
}

export function GiftComposeForm({ onGiftCreated }: GiftComposeFormProps) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [relationshipLabel, setRelationshipLabel] = useState("");
  const [briefing, setBriefing] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail,
          relationshipLabel,
          briefing,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to create gift");
        return;
      }

      onGiftCreated(data.inviteUrl);
    } catch {
      setError("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm text-curious-600">
          Their email
        </label>
        <input
          type="email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          required
          placeholder="someone@example.com"
          className="w-full rounded-lg border border-curious-200 bg-white px-4 py-3 text-curious-900 placeholder:text-curious-400 focus:border-curious-500 focus:outline-none focus:ring-1 focus:ring-curious-500"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-curious-600">
          Your relationship to them
        </label>
        <input
          type="text"
          value={relationshipLabel}
          onChange={(e) => setRelationshipLabel(e.target.value)}
          required
          placeholder="friend, partner, sibling, mentor..."
          className="w-full rounded-lg border border-curious-200 bg-white px-4 py-3 text-curious-900 placeholder:text-curious-400 focus:border-curious-500 focus:outline-none focus:ring-1 focus:ring-curious-500"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-curious-600">
          What makes them remarkable?
        </label>
        <p className="text-xs text-curious-400 italic">
          Tell the agent what you see in this person. What threads should it
          pull? What stories should it ask about? This briefing is private —
          they&apos;ll never see it, but they&apos;ll feel its effect.
        </p>
        <textarea
          value={briefing}
          onChange={(e) => setBriefing(e.target.value)}
          required
          minLength={10}
          rows={6}
          placeholder="They have this way of seeing beauty in ordinary things. They once told me about..."
          className="w-full resize-none rounded-lg border border-curious-200 bg-white px-4 py-3 text-curious-900 placeholder:text-curious-400 focus:border-curious-500 focus:outline-none focus:ring-1 focus:ring-curious-500"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-curious-800 px-4 py-3 text-white font-medium hover:bg-curious-700 transition-colors disabled:opacity-50"
      >
        {isSubmitting ? "Creating..." : "Gift this agent"}
      </button>
    </form>
  );
}
