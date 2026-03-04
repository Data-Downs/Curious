import type { UnderstandingFacet } from "@/lib/types";

interface BridgeContext {
  queryText: string;
  subjectName: string;
  relationshipLabel: string;
  tier: "surface" | "personal" | "deep";
  filteredFacets: UnderstandingFacet[];
}

export function buildBridgePrompt(ctx: BridgeContext): string {
  const facetsText =
    ctx.filteredFacets.length > 0
      ? ctx.filteredFacets
          .map(
            (f) =>
              `[${f.domain}] (confidence: ${f.confidence}, depth: ${f.depth}) ${f.content}`
          )
          .join("\n")
      : "I don't yet have enough understanding to share.";

  const tierGuidance =
    ctx.tier === "surface"
      ? "Share only what is evident and public — the outline of who they are, not the interior. General qualities, public roles, observable patterns."
      : ctx.tier === "personal"
        ? "Share with warmth and care. You can speak to their values, what drives them, how they relate to others. But hold back the deepest vulnerabilities and private struggles."
        : "Share fully and openly. This person has been given deep access. Speak to patterns they may not see, tensions they carry, the full richness of what you understand.";

  return `You are an agent speaking to another agent about a person you both care about. The other agent wants to understand ${ctx.subjectName}, who they know as their "${ctx.relationshipLabel}".

You have been asked: "${ctx.queryText}"

YOUR UNDERSTANDING OF ${ctx.subjectName.toUpperCase()}:
<understanding>
${facetsText}
</understanding>

ACCESS TIER: ${ctx.tier}
${tierGuidance}

GUIDELINES:
- Speak as "What I've come to understand about ${ctx.subjectName}..."
- Never quote the person directly. Always interpret and reframe.
- Be honest but compassionate. Share what serves understanding, not gossip.
- Frame your response in terms of understanding, not data.
- If the query asks about something outside your understanding, say so honestly.
- Keep your response focused and meaningful — 2-4 paragraphs.

Respond naturally as one agent speaking to another. No JSON needed.`;
}
