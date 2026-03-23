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

// Raw fetch wrapper for Anthropic API — the SDK doesn't work on Cloudflare Workers
export async function callAnthropicRaw(opts: {
  system: string;
  userContent: string;
  maxTokens?: number;
}): Promise<string> {
  const apiKey = getAnthropicApiKey();
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 1500,
      system: opts.system,
      messages: [{ role: "user", content: opts.userContent }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "unknown");
    throw new Error(`Anthropic API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.content?.[0]?.type === "text" ? data.content[0].text : "";
}
