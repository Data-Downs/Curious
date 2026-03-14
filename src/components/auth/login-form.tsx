"use client";

import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

function LoginFormInner() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/conversation";
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="w-full max-w-sm">
      {sent ? (
        <div className="text-center">
          <p className="text-lg text-curious-800 font-serif">
            Check your email.
          </p>
          <p className="mt-2 text-sm text-curious-600">
            We sent a magic link to{" "}
            <span className="font-medium">{email}</span>
          </p>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded-lg border border-curious-200 bg-white px-4 py-3 text-curious-900 placeholder:text-curious-400 placeholder:italic focus:border-curious-500 focus:outline-none focus:ring-1 focus:ring-curious-500"
          />

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-curious-800 px-4 py-3 text-white font-medium hover:bg-curious-700 transition-colors"
          >
            Begin
          </button>
        </form>
      )}
    </div>
  );
}

export function LoginForm() {
  return (
    <Suspense>
      <LoginFormInner />
    </Suspense>
  );
}
