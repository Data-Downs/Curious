"use client";

import Link from "next/link";

const experiments = [
  {
    id: "canvas",
    title: "Canvas",
    description:
      "No input field. The page is the canvas. You type directly onto it. Questions reveal word-by-word.",
    color: "bg-curious-100",
  },
  {
    id: "voice",
    title: "Voice",
    description:
      "Hold the mic to speak. Questions typewriter in. A darker, more intimate space.",
    color: "bg-curious-950",
    textColor: "text-curious-100",
  },
  {
    id: "poetic",
    title: "Poetic",
    description:
      "One thing at a time. Words appear slowly. No history. Each exchange dissolves into the next.",
    color: "bg-curious-50",
  },
];

export default function LabPage() {
  return (
    <div className="min-h-dvh bg-curious-50 flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full">
        <h1 className="font-serif text-3xl text-curious-900 mb-2">Lab</h1>
        <p className="text-sm text-curious-500 mb-10 font-serif italic">
          Interaction experiments. Same conversation, different textures.
        </p>

        <div className="flex flex-col gap-4">
          {experiments.map((exp) => (
            <Link
              key={exp.id}
              href={`/lab/${exp.id}`}
              className={`block rounded-2xl p-6 ${exp.color} ${
                exp.textColor ?? "text-curious-900"
              } transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
            >
              <h2 className="font-serif text-xl mb-1">{exp.title}</h2>
              <p
                className={`text-sm ${
                  exp.textColor
                    ? "text-curious-400"
                    : "text-curious-600"
                } font-serif`}
              >
                {exp.description}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/conversation"
            className="text-xs text-curious-400 hover:text-curious-600 transition-colors font-serif"
          >
            back to main conversation
          </Link>
        </div>
      </div>
    </div>
  );
}
