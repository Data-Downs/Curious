"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  getActivePersonaKey,
  getActivePersona,
  playAsPersona,
  exitPersonaMode,
} from "@/lib/persona-mode";
import { PERSONA_IDS } from "@/lib/test-personas";

const PERSONA_KEYS = Object.keys(PERSONA_IDS) as (keyof typeof PERSONA_IDS)[];

export function PersonaBar() {
  const [personaKey, setPersonaKey] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setPersonaKey(getActivePersonaKey());
  }, []);

  // Don't show on lab pages (dashboard has its own controls)
  if (pathname?.startsWith("/lab")) return null;

  // Don't show if not in persona mode
  if (!personaKey) return null;

  const persona = getActivePersona();
  if (!persona) return null;

  const handleSwitch = async (key: string) => {
    if (key === personaKey || switching) return;
    setSwitching(true);
    const result = await playAsPersona(key);
    if (result.success) {
      setPersonaKey(key);
      router.refresh();
    }
    setSwitching(false);
  };

  const handleExit = async () => {
    setSwitching(true);
    await exitPersonaMode();
    setPersonaKey(null);
    setSwitching(false);
    router.push("/lab/personas");
  };

  return (
    <>
    {/* Spacer so page content isn't hidden behind the fixed bar */}
    <div className="h-10" />
    <div className="fixed top-0 left-0 right-0 z-[60] bg-curious-950/95 backdrop-blur-sm border-b border-curious-800">
      <div className="flex items-center justify-between px-4 py-2 max-w-2xl mx-auto">
        {/* Current persona */}
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-serif text-white"
            style={{ backgroundColor: persona.color }}
          >
            {persona.displayName[0]}
          </div>
          <span className="text-xs text-curious-300">
            Playing as <span className="font-medium text-curious-100">{persona.displayName}</span>
          </span>
        </div>

        {/* Quick switch */}
        <div className="flex items-center gap-1">
          {PERSONA_KEYS.map((key) => {
            const isActive = key === personaKey;
            const p = { elena: "E", marcus: "M", priya: "P", leo: "L", jade: "J" }[key];
            return (
              <button
                key={key}
                onClick={() => handleSwitch(key)}
                disabled={switching}
                className={`w-6 h-6 rounded-full text-[10px] font-medium transition-all ${
                  isActive
                    ? "bg-curious-500 text-white ring-1 ring-curious-300"
                    : "bg-curious-800 text-curious-500 hover:bg-curious-700 hover:text-curious-300"
                } disabled:opacity-50`}
                title={key}
              >
                {p}
              </button>
            );
          })}

          <div className="w-px h-4 bg-curious-700 mx-1" />

          <button
            onClick={handleExit}
            disabled={switching}
            className="text-[10px] text-curious-500 hover:text-curious-300 transition-colors px-2 disabled:opacity-50"
          >
            Exit
          </button>

          <button
            onClick={() => router.push("/lab/personas")}
            className="text-[10px] text-curious-500 hover:text-curious-300 transition-colors px-2"
          >
            Lab
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
