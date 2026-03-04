"use client";

import { useEffect, useState } from "react";
import type { Reflection } from "@/lib/types";
import { ReflectionCard } from "@/components/reflections/reflection-card";
import { RequestReflectionButton } from "@/components/reflections/request-reflection-button";

export default function ReflectionsPage() {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reflections")
      .then((r) => r.json())
      .then((data) => {
        setReflections(data.reflections ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleNewReflection = (reflection: Reflection) => {
    setReflections((prev) => [reflection, ...prev]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-curious-50">
        <div className="flex gap-2">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-curious-50 pb-24">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-2xl font-serif text-curious-900">Reflections</h1>
          <p className="text-sm text-curious-500">
            What I&apos;ve come to understand about you.
          </p>
        </header>

        <div className="flex justify-center">
          <RequestReflectionButton
            onReflectionGenerated={handleNewReflection}
          />
        </div>

        {reflections.length === 0 && (
          <p className="text-center text-sm text-curious-400 font-serif italic py-12">
            No reflections yet. Have a few conversations first, then come back.
          </p>
        )}

        <div className="space-y-6">
          {reflections.map((r) => (
            <ReflectionCard key={r.id} reflection={r} />
          ))}
        </div>
      </div>
    </div>
  );
}
