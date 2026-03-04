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

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    }
    checkAuth();
  }, []);

  function handleSignIn() {
    router.push(`/auth/login?next=/gift/${inviteCode}`);
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
        setError(null);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to claim gift");
        return;
      }

      router.push("/conversation");
    } catch {
      setError("Something went wrong");
    } finally {
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

      {isLoggedIn === false ? (
        <button
          onClick={handleSignIn}
          className="rounded-full bg-curious-800 px-8 py-3 text-white font-medium hover:bg-curious-700 transition-colors"
        >
          Sign in to accept this gift
        </button>
      ) : (
        <button
          onClick={handleClaim}
          disabled={isClaiming || isLoggedIn === null}
          className="rounded-full bg-curious-800 px-8 py-3 text-white font-medium hover:bg-curious-700 transition-colors disabled:opacity-50"
        >
          {isClaiming ? "Accepting..." : "Accept this gift"}
        </button>
      )}
    </div>
  );
}
