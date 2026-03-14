"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="text-xs text-curious-400 hover:text-curious-700 transition-colors disabled:opacity-50"
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
