"use client";

interface MessageBubbleProps {
  role: "agent" | "user";
  content: string;
  inputType?: "text" | "voice" | "photo" | "url";
}

export function MessageBubble({ role, content, inputType }: MessageBubbleProps) {
  if (role === "agent") {
    return (
      <div className="px-6 py-3">
        <p className="text-lg font-serif text-curious-800 leading-relaxed">
          {content}
        </p>
      </div>
    );
  }

  return (
    <div className="px-6 py-3 flex justify-end">
      <div className="bg-curious-100 rounded-2xl rounded-br-md px-4 py-3 max-w-[80%]">
        {inputType === "voice" && (
          <span className="text-xs text-curious-500 block mb-1">voice</span>
        )}
        {inputType === "photo" && (
          <span className="text-xs text-curious-500 block mb-1">photo</span>
        )}
        {inputType === "url" && (
          <span className="text-xs text-curious-500 block mb-1">link</span>
        )}
        <p className="text-curious-800 leading-relaxed">{content}</p>
      </div>
    </div>
  );
}
