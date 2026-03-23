"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface GiftClaimCardProps {
  inviteCode: string;
  relationshipLabel: string;
}

export function GiftClaimCard({
  inviteCode,
  relationshipLabel,
}: GiftClaimCardProps) {
  const router = useRouter();
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
        // Auto-claim if already logged in
        handleClaim();
      } else {
        setIsLoggedIn(false);
      }
    }
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/gift/${inviteCode}/claim`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setEmailSent(true);
    }
  }

  async function handleClaim() {
    setIsClaiming(true);
    setError(null);

    try {
      const response = await fetch("/api/gifts/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      });

      if (response.status === 401) {
        setIsLoggedIn(false);
        setIsClaiming(false);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to claim gift");
        setIsClaiming(false);
        return;
      }

      router.push("/conversation");
    } catch {
      setError("Something went wrong");
      setIsClaiming(false);
    }
  }

  return (
    <div className="bg-white/60 rounded-2xl px-6 py-8 text-center space-y-6 animate-fade-in-up">
      <div className="space-y-3">
        <p className="text-lg font-serif text-curious-800">
          Someone who knows you as their{" "}
          <span className="italic">{relationshipLabel}</span> has gifted you a
          curious agent.
        </p>
        <p className="text-sm text-curious-500">
          This agent has been prepared with insight about what makes you
          remarkable. It will ask better questions because of what they shared.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {isLoggedIn === null || isClaiming ? (
        <div className="flex justify-center gap-2 py-3">
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
      ) : isLoggedIn ? (
        <button
          onClick={handleClaim}
          className="rounded-full bg-curious-800 px-8 py-3 text-white font-medium hover:bg-curious-700 transition-colors"
        >
          Accept this gift
        </button>
      ) : emailSent ? (
        <div className="space-y-2">
          <p className="text-lg text-curious-800 font-serif">
            Check your email.
          </p>
          <p className="text-sm text-curious-600">
            We sent a link to{" "}
            <span className="font-medium">{email}</span>.
            Click it and you&apos;ll be brought straight in.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSendLink} className="space-y-4">
          <p className="text-sm text-curious-600">
            Enter your email to accept this gift.
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded-lg border border-curious-200 bg-white px-4 py-3 text-curious-900 placeholder:text-curious-400 placeholder:italic focus:border-curious-500 focus:outline-none focus:ring-1 focus:ring-curious-500"
          />
          <button
            type="submit"
            className="w-full rounded-full bg-curious-800 px-8 py-3 text-white font-medium hover:bg-curious-700 transition-colors"
          >
            Continue
          </button>
        </form>
      )}
    </div>
  );
}
