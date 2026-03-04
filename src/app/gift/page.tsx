"use client";

import { useState } from "react";
import { GiftComposeForm } from "@/components/gift/gift-compose-form";

export default function GiftPage() {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  if (inviteUrl) {
    const fullUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${inviteUrl}`
        : inviteUrl;

    return (
      <div className="min-h-screen bg-curious-50 pb-24">
        <div className="max-w-md mx-auto px-4 py-12 text-center space-y-6">
          <div className="animate-fade-in-up space-y-4">
            <p className="text-xl font-serif text-curious-800">
              Gift created.
            </p>
            <p className="text-sm text-curious-500">
              Share this link with them:
            </p>
            <div className="bg-white rounded-lg border border-curious-200 px-4 py-3">
              <p className="text-sm text-curious-700 break-all font-mono">
                {fullUrl}
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(fullUrl);
              }}
              className="text-sm text-curious-600 hover:text-curious-800 transition-colors underline"
            >
              Copy link
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-curious-50 pb-24">
      <div className="max-w-md mx-auto px-4 py-8 space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-2xl font-serif text-curious-900">
            Gift an Agent
          </h1>
          <p className="text-sm text-curious-500">
            Give someone you care about a curious presence, pre-briefed with
            what makes them remarkable.
          </p>
        </header>

        <GiftComposeForm onGiftCreated={setInviteUrl} />
      </div>
    </div>
  );
}
