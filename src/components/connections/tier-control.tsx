"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface TierControlProps {
  connectionId: string;
  currentTier: string;
  /** Which tier field this controls (user's sharing tier) */
  tierField: "tier_a_to_b" | "tier_b_to_a";
  onTierChanged: (newTier: string) => void;
}

const TIERS = [
  { value: "surface", label: "Surface", description: "Basic facts and public qualities" },
  { value: "personal", label: "Personal", description: "Values, motivations, and stories" },
  { value: "deep", label: "Deep", description: "Full understanding, including patterns and struggles" },
] as const;

export function TierControl({
  connectionId,
  currentTier,
  tierField,
  onTierChanged,
}: TierControlProps) {
  const [updating, setUpdating] = useState(false);

  async function handleChange(newTier: string) {
    if (newTier === currentTier || updating) return;
    setUpdating(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("connections")
      .update({ [tierField]: newTier })
      .eq("id", connectionId);

    if (!error) {
      onTierChanged(newTier);
    }
    setUpdating(false);
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-curious-500 uppercase tracking-wide">
        What you share
      </p>
      <div className="flex gap-2">
        {TIERS.map((tier) => (
          <button
            key={tier.value}
            onClick={() => handleChange(tier.value)}
            disabled={updating}
            className={`flex-1 rounded-lg px-3 py-2 text-xs transition-colors ${
              currentTier === tier.value
                ? "bg-curious-800 text-white"
                : "bg-curious-100/60 text-curious-600 hover:bg-curious-200/60"
            } disabled:opacity-50`}
          >
            {tier.label}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-curious-400">
        {TIERS.find((t) => t.value === currentTier)?.description}
      </p>
    </div>
  );
}
