import { z } from "zod";

// ─── Understanding Domains ───────────────────────────────────────────────────

export const UNDERSTANDING_DOMAINS = [
  "identity",
  "values",
  "relationships",
  "purpose",
  "experiences",
  "patterns",
  "aspirations",
  "struggles",
  "joys",
  "worldview",
] as const;

export type UnderstandingDomain = (typeof UNDERSTANDING_DOMAINS)[number];

// ─── Zod Schemas (API boundary validation) ───────────────────────────────────

export const understandingFacetSchema = z.object({
  domain: z.enum(UNDERSTANDING_DOMAINS),
  content: z.string().min(1),
  confidence: z.number().min(0).max(1),
  depth: z.number().int().min(1).max(5),
});

export const understandingUpdateSchema = z.object({
  facets: z.array(understandingFacetSchema),
  voice_style: z
    .object({
      tone: z.string(),
      directness: z.number().min(0).max(1),
      metaphor_affinity: z.number().min(0).max(1),
    })
    .optional(),
});

export const conversationRequestSchema = z.object({
  message: z.string().min(1),
  inputType: z.enum(["text", "voice", "photo", "url"]),
  mediaDescription: z.string().optional(),
  conversationId: z.string().min(1),
  recentMessages: z
    .array(
      z.object({
        role: z.enum(["agent", "user"]),
        content: z.string(),
      })
    )
    .optional(),
});

export const reflectionRequestSchema = z.object({});

export const giftRequestSchema = z.object({
  recipientEmail: z.string().email(),
  briefing: z.string().min(10),
  relationshipLabel: z.string().min(1),
});

export const giftQueryRequestSchema = z.object({
  connectionId: z.string().uuid(),
  query: z.string().min(1),
});

// ─── TypeScript Types ────────────────────────────────────────────────────────

export interface UnderstandingFacet {
  id: string;
  domain: UnderstandingDomain;
  content: string;
  confidence: number;
  depth: number;
  is_active: boolean;
  created_at: string;
}

export interface VoiceStyle {
  tone: string;
  directness: number;
  metaphor_affinity: number;
}

export interface Profile {
  id: string;
  display_name: string;
  voice_style: VoiceStyle;
  total_conversations: number;
  last_conversation_at: string | null;
}

export interface Connection {
  id: string;
  gift_id: string | null;
  user_a_id: string;
  user_b_id: string;
  tier_a_to_b: "surface" | "personal" | "deep";
  tier_b_to_a: "surface" | "personal" | "deep";
  created_at: string;
}

export interface AgentGift {
  id: string;
  gifter_id: string;
  recipient_email: string;
  recipient_id: string | null;
  briefing: string;
  relationship_label: string;
  status: "pending" | "accepted" | "declined";
  invite_code: string;
  created_at: string;
  claimed_at: string | null;
}

export interface Reflection {
  id: string;
  title: string;
  content: string;
  domains: string[];
  created_at: string;
}

export interface ConversationSession {
  id: string;
  session_summary: string | null;
  themes: string[];
  agent_notes: string | null;
  message_count: number;
  started_at: string;
  ended_at: string | null;
}

// ─── Local-only types (IndexedDB) ───────────────────────────────────────────

export interface LocalConversation {
  id: string;
  startedAt: Date;
  lastMessageAt: Date;
  messageCount: number;
}

export interface LocalMessage {
  id: string;
  conversationId: string;
  role: "agent" | "user";
  content: string;
  inputType: "text" | "voice" | "photo" | "url";
  mediaId?: string;
  timestamp: Date;
}

export interface LocalMediaItem {
  id: string;
  messageId: string;
  type: "audio" | "image" | "url";
  blob?: Blob;
  url?: string;
  transcript?: string;
  description?: string;
  createdAt: Date;
}

export interface CuriosityThread {
  id: string;
  domain: string;
  thread: string;
  explored: boolean;
  sourceGiftId?: string;
  createdAt: Date;
}
