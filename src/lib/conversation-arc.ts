/**
 * Conversation Arc — The Tippett Spiral
 *
 * Maps the eight-layer questioning architecture inspired by Krista Tippett's
 * On Being interviews onto the Curious conversation model.
 *
 * Two spirals operate simultaneously:
 * 1. Macro arc — across the full relationship (conversations 1 → N)
 * 2. Micro arc — within a single conversation session (messages 1 → N)
 *
 * The shape is an hourglass that breathes:
 * Wide (origin) → Narrowing (calling, naming) → Most intimate (embodiment)
 * → Expanding (fracture, bridge) → Widest (expanse) → Return (hope, integration)
 */

import type { UnderstandingFacet } from "@/lib/types";

// ─── The Eight Layers ────────────────────────────────────────────────────────

export const CONVERSATION_LAYERS = [
  "origin",
  "calling",
  "naming",
  "embodiment",
  "fracture",
  "bridge",
  "expanse",
  "return",
] as const;

export type ConversationLayer = (typeof CONVERSATION_LAYERS)[number];

export interface LayerGuidance {
  /** Primary layer the next question should draw from */
  primary: ConversationLayer;
  /** Secondary layer that can colour the question */
  secondary: ConversationLayer | null;
  /** How deep within this layer (0-1, where 1 = fully committed to this layer) */
  intensity: number;
  /** Human-readable explanation for the prompt */
  reasoning: string;
}

export interface ArcContext {
  conversationCount: number;
  messageCountInSession: number;
  facets: UnderstandingFacet[];
}

// ─── Layer Descriptions (for the prompt) ─────────────────────────────────────

export const LAYER_DESCRIPTIONS: Record<
  ConversationLayer,
  { name: string; subtitle: string; description: string; examples: string[] }
> = {
  origin: {
    name: "The Ground",
    subtitle: "Origin & Formation",
    description:
      "Where did this person come from? The ground of their childhood, their earliest world. Not asking about belief — asking about a story. Everyone has one. This question plants people in a particular way.",
    examples: [
      "What was the world like where you grew up?",
      "Tell me about the house you grew up in — what did it feel like?",
      "Who were the people who shaped your earliest sense of the world?",
      "What did your family talk about at the dinner table — or not talk about?",
    ],
  },
  calling: {
    name: "The Path",
    subtitle: "Calling & Becoming",
    description:
      "How did that child become this person? Trace the crooked thread forward. Turning points, vocational surprises, the messy non-linear reality of formation. Honour the path, not the polished biography.",
    examples: [
      "How did you come to do what you do? Was there a moment, or was it gradual?",
      "What did you think you'd grow up to be — and how did that shift?",
      "Tell me about the relationship between who you were then and the work you do now.",
      "Was there a fork in the road where everything could have gone differently?",
    ],
  },
  naming: {
    name: "The Naming",
    subtitle: "Redefining Big Words",
    description:
      "Invite them to reclaim and personally redefine words that have become flattened by overuse — home, success, love, enough, family, belonging, purpose. Not dictionary definitions. Breathe life back into language through their particular experience.",
    examples: [
      "What does the word 'home' mean to you now — has it changed?",
      "When you say 'success', what do you actually picture?",
      "How would you define 'enough' — in your life, not in theory?",
      "What does 'belonging' feel like for you — where do you find it?",
    ],
  },
  embodiment: {
    name: "The Body",
    subtitle: "Lived Experience & the Daily",
    description:
      "Once something has been named, insist it be grounded in the physical and the daily. Pull ideas from the intellectual into the sensory and real. This is where conversation stops sounding like a lecture and starts sounding like life.",
    examples: [
      "What does that look like on a Tuesday morning?",
      "Where do you feel that — not as an idea, but in your actual life?",
      "Can you give me a picture of what that means between actual people?",
      "When was the last time that showed up — what happened?",
    ],
  },
  fracture: {
    name: "The Fracture",
    subtitle: "Challenge & Transformation",
    description:
      "Gently press into the places where understanding broke down or was remade. Not picking fights — looking for the fault lines where genuine growth happened. Where beliefs shifted, where the old story stopped working.",
    examples: [
      "How has your understanding of that changed over the years?",
      "Was there a moment when what you believed stopped holding?",
      "What challenged you most deeply in what you thought you knew?",
      "Where did you have to let go of something you were sure about?",
    ],
  },
  bridge: {
    name: "The Bridge",
    subtitle: "Unexpected Connections",
    description:
      "Connect domains that don't usually speak to each other in this person's life. Their work and their relationships. Their childhood and their ambitions. Their struggles and their joys. The question of what it means to be human cannot be answered from within any single part of a life.",
    examples: [
      "How does what you do for work connect to what you care about most deeply?",
      "Do you see a thread between [thing A they mentioned] and [thing B]?",
      "What has being a [role] taught you about [seemingly unrelated domain]?",
      "Is there something from your [early life / work / relationships] that shows up in unexpected places?",
    ],
  },
  expanse: {
    name: "The Expanse",
    subtitle: "The Animating Questions",
    description:
      "The largest questions — not asked directly, but moved toward. What does it mean to be human? How do you want to live? Who will you be to the people around you? These are the horizon every conversation moves toward. Each person provides a different angle.",
    examples: [
      "What do you think you're really here to do — not your job, but your purpose?",
      "What question are you carrying right now that you can't quite answer?",
      "What amidst everything that's breaking in the world feels like it wants to be born?",
      "If you could pass one understanding to the next generation, what would it be?",
    ],
  },
  return: {
    name: "The Return",
    subtitle: "Hope, Integration & What Endures",
    description:
      "Bring the conversation back to the personal — now enriched by everything that came before. What sustains them. What gives them hope (not optimism — real hope). What they'd want someone to carry away. The spiral completes: from the personal, through the universal, back to the personal.",
    examples: [
      "What gives you hope — and I don't mean optimism, I mean real hope?",
      "What in the way you're living right now is life-giving — and what depletes you?",
      "What would you want someone who cares about you to understand?",
      "What are you most grateful for that you didn't expect?",
    ],
  },
};

// ─── Macro Arc: Relationship Maturity → Available Layers ─────────────────────

/**
 * Determines which layers are available based on relationship maturity.
 * Early conversations stay in the grounding layers; deeper layers unlock
 * as the relationship develops.
 */
function getAvailableLayers(conversationCount: number): ConversationLayer[] {
  if (conversationCount <= 1) {
    // First conversation: origin and gentle calling
    return ["origin", "calling"];
  }
  if (conversationCount <= 3) {
    // Getting to know them: origin through embodiment
    return ["origin", "calling", "naming", "embodiment"];
  }
  if (conversationCount <= 6) {
    // Deepening: can now enter fracture and bridge
    return ["origin", "calling", "naming", "embodiment", "fracture", "bridge"];
  }
  if (conversationCount <= 10) {
    // Mature relationship: all layers except expanse used sparingly
    return [
      "origin",
      "calling",
      "naming",
      "embodiment",
      "fracture",
      "bridge",
      "expanse",
      "return",
    ];
  }
  // Deep relationship: full spiral, with emphasis on the deeper layers
  return CONVERSATION_LAYERS.slice();
}

// ─── Micro Arc: Position Within Session → Layer Emphasis ─────────────────────

/**
 * Within a single conversation, the hourglass breathes:
 * Opening (wide) → Middle (narrowing) → Heart (intimate) → Expanding → Close (return)
 */
function getSessionPhase(
  messageCount: number
): "opening" | "narrowing" | "heart" | "expanding" | "closing" {
  if (messageCount <= 2) return "opening";
  if (messageCount <= 4) return "narrowing";
  if (messageCount <= 7) return "heart";
  if (messageCount <= 10) return "expanding";
  return "closing";
}

/**
 * Maps session phase to preferred layers, weighted by relationship maturity.
 */
const PHASE_LAYER_AFFINITY: Record<
  ReturnType<typeof getSessionPhase>,
  ConversationLayer[]
> = {
  opening: ["origin", "calling"], // Ground the conversation
  narrowing: ["calling", "naming", "embodiment"], // Get specific
  heart: ["embodiment", "fracture"], // Most intimate
  expanding: ["fracture", "bridge", "expanse"], // Open outward
  closing: ["return", "bridge"], // Come back to the personal
};

// ─── Facet-Aware Layer Selection ─────────────────────────────────────────────

/**
 * Checks which layers have been well-explored based on existing facets.
 * Maps understanding domains to the layers they typically emerge from.
 */
const LAYER_DOMAIN_MAP: Record<ConversationLayer, string[]> = {
  origin: ["identity", "experiences", "relationships"],
  calling: ["identity", "purpose", "experiences"],
  naming: ["values", "worldview"],
  embodiment: ["patterns", "joys", "relationships"],
  fracture: ["struggles", "patterns", "worldview"],
  bridge: ["worldview", "purpose", "values"],
  expanse: ["purpose", "aspirations", "worldview"],
  return: ["joys", "aspirations", "values"],
};

function getLayerSaturation(
  layer: ConversationLayer,
  facets: UnderstandingFacet[]
): number {
  const relevantDomains = LAYER_DOMAIN_MAP[layer];
  const relevantFacets = facets.filter((f) =>
    relevantDomains.includes(f.domain)
  );

  if (relevantFacets.length === 0) return 0;

  const avgDepth =
    relevantFacets.reduce((sum, f) => sum + f.depth, 0) / relevantFacets.length;
  const avgConfidence =
    relevantFacets.reduce((sum, f) => sum + f.confidence, 0) /
    relevantFacets.length;

  // Saturation: 0 (unexplored) to 1 (deeply understood)
  return Math.min(1, (avgDepth / 5) * 0.6 + avgConfidence * 0.4);
}

// ─── Main: Determine Current Layer ───────────────────────────────────────────

export function determineConversationLayer(ctx: ArcContext): LayerGuidance {
  const available = getAvailableLayers(ctx.conversationCount);
  const phase = getSessionPhase(ctx.messageCountInSession);
  const phasePreferred = PHASE_LAYER_AFFINITY[phase];

  // Score each available layer
  const scored = available.map((layer) => {
    let score = 0;

    // Phase affinity: does this layer match where we are in the session?
    const phaseIndex = phasePreferred.indexOf(layer);
    if (phaseIndex === 0) score += 0.5;
    else if (phaseIndex > 0) score += 0.3;

    // Saturation penalty: prefer layers we haven't fully explored
    const saturation = getLayerSaturation(layer, ctx.facets);
    score += (1 - saturation) * 0.35;

    // Maturity bonus: deeper layers get a boost in mature relationships
    const layerIndex = CONVERSATION_LAYERS.indexOf(layer);
    if (ctx.conversationCount > 5) {
      score += (layerIndex / 7) * 0.15;
    }

    return { layer, score, saturation };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  const primary = scored[0];
  const secondary = scored.length > 1 ? scored[1] : null;

  const layerDesc = LAYER_DESCRIPTIONS[primary.layer];
  const phaseDesc =
    phase === "opening"
      ? "opening the conversation — ground it"
      : phase === "narrowing"
        ? "narrowing inward — get specific"
        : phase === "heart"
          ? "at the heart of the conversation — the most intimate territory"
          : phase === "expanding"
            ? "expanding outward — connect and bridge"
            : "drawing toward a close — return to the personal";

  const reasoning = `Session phase: ${phaseDesc}. Primary layer: ${layerDesc.name} (${layerDesc.subtitle}). ${primary.saturation < 0.3 ? "This territory is largely unexplored." : primary.saturation < 0.6 ? "You've touched on this but there's more to discover." : "You know something here — go deeper, not wider."}`;

  return {
    primary: primary.layer,
    secondary: secondary?.layer ?? null,
    intensity: primary.score,
    reasoning,
  };
}
