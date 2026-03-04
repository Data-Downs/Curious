"use client";

import Link from "next/link";

interface ConnectionCardProps {
  id: string;
  displayName: string;
  relationshipLabel: string;
  tier: string;
}

export function ConnectionCard({
  id,
  displayName,
  relationshipLabel,
  tier,
}: ConnectionCardProps) {
  return (
    <Link
      href={`/connections/${id}`}
      className="block bg-white/60 rounded-2xl px-6 py-5 hover:bg-white/80 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-serif text-curious-900">
            {displayName || "Someone"}
          </p>
          <p className="text-xs text-curious-500">{relationshipLabel}</p>
        </div>
        <span className="text-xs text-curious-400 bg-curious-100/60 rounded-full px-3 py-1">
          {tier}
        </span>
      </div>
    </Link>
  );
}
