import type { UnderstandingFacet } from "@/lib/types";

interface UnderstandingContext {
  transcript: { role: string; content: string }[];
  existingFacets: UnderstandingFacet[];
}

export function buildUnderstandingPrompt(ctx: UnderstandingContext): string {
  const existingFacetsText =
    ctx.existingFacets.length > 0
      ? ctx.existingFacets
          .map(
            (f) =>
              `  - [${f.id}] ${f.domain} (confidence: ${f.confidence}, depth: ${f.depth}): ${f.content}`
          )
          .join("\n")
      : "  None yet — this is the first conversation.";

  const transcriptText = ctx.transcript
    .map((m) => `${m.role === "agent" ? "Agent" : "Human"}: ${m.content}`)
    .join("\n");

  return `You are an understanding engine. You have just witnessed a conversation between a curious agent and a human. Your job is to interpret what you learned about the human and express it as structured understanding.

You are NOT quoting the human. You are interpreting — like a therapist writing clinical notes, or a biographer synthesizing interviews. Never use the human's exact words. Always reframe in your own interpretive language.

DOMAINS (the 10 lenses of understanding):
- identity: Who they are, how they see themselves, their roles and self-concept
- values: What they hold sacred, their moral compass, non-negotiables
- relationships: How they connect with others, their relational patterns
- purpose: What drives them, their sense of meaning and direction
- experiences: Formative moments, stories that shaped them
- patterns: Recurring behaviors, habits of mind, tendencies they may not see
- aspirations: What they're reaching toward, dreams both spoken and implied
- struggles: What weighs on them, tensions they carry, unresolved questions
- joys: What lights them up, sources of delight and energy
- worldview: How they see the world, their philosophical orientation

EXISTING UNDERSTANDING:
<existing_facets>
${existingFacetsText}
</existing_facets>

CONVERSATION TRANSCRIPT:
<transcript>
${transcriptText}
</transcript>

INSTRUCTIONS:
1. Read the conversation carefully. What did you learn about this person?
2. For each insight, decide:
   - "new" — a genuinely new facet not covered by existing understanding
   - "update" — an existing facet should be revised (reference its ID)
   - "deactivate" — an existing facet is contradicted or no longer accurate (reference its ID)
3. Assign confidence (0-1): How certain are you? Single mention = 0.3-0.5. Repeated/emphatic = 0.6-0.8. Deeply demonstrated = 0.9+.
4. Assign depth (1-5): 1=surface fact, 2=stated preference, 3=emotional truth, 4=pattern they may not fully see, 5=what they can't yet articulate.
5. Write a brief session summary (2-3 sentences, interpretive, not a transcript recap).
6. Extract 2-5 themes (short phrases) that characterized this conversation.
7. Write agent notes: what should the agent explore next time?

Respond with ONLY valid JSON matching this exact structure:

{
  "facets": [
    {
      "action": "new",
      "domain": "values",
      "content": "Your interpreted understanding...",
      "confidence": 0.6,
      "depth": 3
    },
    {
      "action": "update",
      "existing_facet_id": "uuid-here",
      "domain": "identity",
      "content": "Revised understanding...",
      "confidence": 0.8,
      "depth": 4
    },
    {
      "action": "deactivate",
      "existing_facet_id": "uuid-here"
    }
  ],
  "session_summary": "Interpretive summary of what was revealed...",
  "themes": ["theme one", "theme two"],
  "agent_notes": "What to explore next time..."
}`;
}
