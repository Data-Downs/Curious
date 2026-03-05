import Anthropic from "@anthropic-ai/sdk";
import { getEnv } from "@/lib/env";

export function getAnthropicClient(): Anthropic {
  return new Anthropic({
    apiKey: getEnv("ANTHROPIC_API_KEY"),
  });
}

export function getAnthropicApiKey(): string | undefined {
  return getEnv("ANTHROPIC_API_KEY");
}

export const MODEL = "claude-sonnet-4-20250514";
