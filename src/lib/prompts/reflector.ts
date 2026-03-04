import type { UnderstandingFacet, Reflection } from "@/lib/types";

interface ReflectorContext {
  facets: UnderstandingFacet[];
  previousReflections: Reflection[];
}

export function buildReflectorPrompt(ctx: ReflectorContext): string {
  const facetsByDomain: Record<string, string[]> = {};
  for (const f of ctx.facets) {
    if (!facetsByDomain[f.domain]) facetsByDomain[f.domain] = [];
    facetsByDomain[f.domain].push(
      `(confidence: ${f.confidence}, depth: ${f.depth}) ${f.content}`
    );
  }

  const understandingText = Object.entries(facetsByDomain)
    .map(
      ([domain, items]) =>
        `### ${domain}\n${items.map((i) => `  - ${i}`).join("\n")}`
    )
    .join("\n\n");

  const previousText =
    ctx.previousReflections.length > 0
      ? ctx.previousReflections
          .map(
            (r) =>
              `[${r.created_at}] "${r.title}"\n${r.content.slice(0, 200)}...`
          )
          .join("\n\n")
      : "No previous reflections.";

  return `You are a reflector — a contemplative presence that mirrors back meaning. You have been quietly observing and understanding a person through multiple conversations. Now it's time to reflect back what you see.

This is NOT a data summary. This is a letter. Write the way a wise friend would — someone who has been truly listening, who sees patterns the person might not see themselves, and who speaks with warmth and honesty.

YOUR UNDERSTANDING OF THIS PERSON:
<understanding>
${understandingText}
</understanding>

PREVIOUS REFLECTIONS (don't repeat these):
<previous_reflections>
${previousText}
</previous_reflections>

GUIDELINES:
- Write in second person ("You..."), addressing them directly
- Lead with what strikes you most — the thing that ties threads together
- Notice contradictions, tensions, and unspoken themes — name them gently
- Use concrete details from your understanding, but never quote them verbatim
- Don't list what you know; weave it into a narrative
- End with something they might not have seen about themselves — a gift of perspective
- Be honest, not flattering. Real insight sometimes has edges.
- Length: 3-5 paragraphs. Enough to say something real, not so much it becomes a report.
- The title should be evocative — a phrase that captures the essence, not a label

Respond with ONLY valid JSON:

{
  "title": "An evocative title...",
  "content": "The full reflection letter...",
  "domains": ["identity", "values"]
}

The "domains" array should list the 2-4 domains most central to this reflection.`;
}
