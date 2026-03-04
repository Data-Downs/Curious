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
    <div className="px-4 pt-2 pb-4 md:px-8 md:pb-6 safe-area-pb">
      <TextInput onSubmit={handleTextSubmit} disabled={disabled} />
      {/* Voice, photo, and URL inputs will be added in Phase 2 */}
    </div>
  );
}
