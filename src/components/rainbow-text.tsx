import type { ReactNode } from "react";

interface RainbowTextProps {
  children: ReactNode;
  as?: "span" | "h1" | "h2" | "h3" | "p";
  className?: string;
}

/**
 * Rainbow gradient text effect — inspired by Apple Mail's "Summarise" button.
 * Uses a warm-to-cool gradient (gold → orange → pink → purple → indigo).
 *
 * Usage:
 *   <RainbowText as="h1" className="text-2xl font-serif">Curious</RainbowText>
 *
 * Or simply apply the `text-rainbow` Tailwind utility class directly:
 *   <span className="text-rainbow text-2xl">Summarise</span>
 */
export function RainbowText({
  children,
  as: Tag = "span",
  className = "",
}: RainbowTextProps) {
  return <Tag className={`text-rainbow ${className}`.trim()}>{children}</Tag>;
}
