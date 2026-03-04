"use client";

interface QuestionDisplayProps {
  question: string;
  isStreaming?: boolean;
}

export function QuestionDisplay({ question, isStreaming }: QuestionDisplayProps) {
  if (!question && !isStreaming) return null;

  return (
    <div className="flex items-start justify-center px-6 py-12 animate-fade-in-up">
      <p className="text-2xl md:text-3xl lg:text-4xl font-serif text-curious-900 leading-relaxed md:leading-loose text-center max-w-2xl">
        {question}
        {isStreaming && (
          <span className="inline-block w-0.5 h-5 bg-curious-300 ml-0.5 rounded-full animate-gentle-pulse" />
        )}
      </p>
    </div>
  );
}
