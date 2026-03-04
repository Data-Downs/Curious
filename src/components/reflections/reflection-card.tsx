"use client";

import type { Reflection } from "@/lib/types";

interface ReflectionCardProps {
  reflection: Reflection;
}

export function ReflectionCard({ reflection }: ReflectionCardProps) {
  const date = new Date(reflection.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <article className="bg-white/60 rounded-2xl px-6 py-8 md:px-8 md:py-10 space-y-4 animate-fade-in-up">
      <header className="space-y-2">
        <time className="text-xs text-curious-400 tracking-wide uppercase">
          {date}
        </time>
        <h2 className="text-xl md:text-2xl font-serif text-curious-900 leading-snug">
          {reflection.title}
        </h2>
      </header>

      <div className="text-base font-serif text-curious-700 leading-relaxed whitespace-pre-line">
        {reflection.content}
      </div>

      <footer className="flex gap-2 pt-2">
        {reflection.domains.map((domain) => (
          <span
            key={domain}
            className="text-xs text-curious-400 bg-curious-100/60 rounded-full px-3 py-1"
          >
            {domain}
          </span>
        ))}
      </footer>
    </article>
  );
}
