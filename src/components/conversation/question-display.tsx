"use client";

interface QuestionDisplayProps {
  question: string;
  reflection?: string;
  isStreaming?: boolean;
}

export function QuestionDisplay({ question, reflection, isStreaming }: QuestionDisplayProps) {
  if (!question && !reflection && !isStreaming) return null;

  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 gap-6 max-w-2xl">
      {reflection && (
        <p className="text-base md:text-lg font-serif italic text-curious-600 leading-relaxed text-center animate-fade-in-up">
          {reflection}
        </p>
      )}
      {question && (
        <p className="text-2xl md:text-3xl lg:text-4xl font-serif text-curious-900 leading-relaxed md:leading-loose text-center animate-fade-in-up">
          {question}
          {isStreaming && (
            <span className="inline-block w-0.5 h-5 bg-curious-300 ml-0.5 rounded-full animate-gentle-pulse" />
          )}
        </p>
      )}
    </div>
  );
}
