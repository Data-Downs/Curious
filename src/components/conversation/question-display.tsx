"use client";

interface QuestionDisplayProps {
  question: string;
  isStreaming?: boolean;
}

export function QuestionDisplay({ question, isStreaming }: QuestionDisplayProps) {
  return (
    <div className="flex items-start justify-center px-6 py-12 min-h-[40vh]">
      <p className="text-xl md:text-2xl font-serif text-curious-900 leading-relaxed text-center max-w-lg">
        {question}
        {isStreaming && (
          <span className="inline-block w-0.5 h-5 bg-curious-400 ml-0.5 animate-pulse" />
        )}
      </p>
    </div>
  );
}
