"use client";

import { TextInput } from "./text-input";

interface InputBarProps {
  onSubmit: (text: string, inputType: "text" | "voice" | "photo" | "url") => void;
  disabled?: boolean;
}

export function InputBar({ onSubmit, disabled }: InputBarProps) {
  function handleTextSubmit(text: string) {
    onSubmit(text, "text");
  }

  return (
    <div className="border-t border-curious-100 bg-curious-50 px-4 py-3 safe-area-pb">
      <TextInput onSubmit={handleTextSubmit} disabled={disabled} />
      {/* Voice, photo, and URL inputs will be added in Phase 2 */}
    </div>
  );
}
