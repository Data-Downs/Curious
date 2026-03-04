import { describe, it, expect } from "vitest";
import {
  conversationRequestSchema,
  giftRequestSchema,
  understandingFacetSchema,
} from "@/lib/types";

describe("conversationRequestSchema", () => {
  it("validates a valid text message", () => {
    const result = conversationRequestSchema.safeParse({
      message: "Hello there",
      inputType: "text",
      conversationId: "abc123",
    });
    expect(result.success).toBe(true);
  });

  it("validates a voice message", () => {
    const result = conversationRequestSchema.safeParse({
      message: "Transcribed voice content",
      inputType: "voice",
      conversationId: "abc123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty messages", () => {
    const result = conversationRequestSchema.safeParse({
      message: "",
      inputType: "text",
      conversationId: "abc123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid input types", () => {
    const result = conversationRequestSchema.safeParse({
      message: "Hello",
      inputType: "video",
      conversationId: "abc123",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional recentMessages", () => {
    const result = conversationRequestSchema.safeParse({
      message: "Hello",
      inputType: "text",
      conversationId: "abc123",
      recentMessages: [
        { role: "agent", content: "What's on your mind?" },
        { role: "user", content: "My family" },
      ],
    });
    expect(result.success).toBe(true);
  });
});

describe("giftRequestSchema", () => {
  it("validates a valid gift request", () => {
    const result = giftRequestSchema.safeParse({
      recipientEmail: "duncan@example.com",
      briefing:
        "Duncan is an incredible engineer who has invented some of the most important interaction technologies in the world.",
      relationshipLabel: "my closest friend",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a briefing that is too short", () => {
    const result = giftRequestSchema.safeParse({
      recipientEmail: "duncan@example.com",
      briefing: "Nice guy",
      relationshipLabel: "friend",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid emails", () => {
    const result = giftRequestSchema.safeParse({
      recipientEmail: "not-an-email",
      briefing: "A wonderful human being who deserves the world.",
      relationshipLabel: "friend",
    });
    expect(result.success).toBe(false);
  });
});

describe("understandingFacetSchema", () => {
  it("validates a valid facet", () => {
    const result = understandingFacetSchema.safeParse({
      domain: "values",
      content: "Deeply committed to environmental sustainability",
      confidence: 0.8,
      depth: 3,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid domains", () => {
    const result = understandingFacetSchema.safeParse({
      domain: "hobbies",
      content: "Likes golf",
      confidence: 0.5,
      depth: 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects confidence outside 0-1", () => {
    const result = understandingFacetSchema.safeParse({
      domain: "values",
      content: "Something",
      confidence: 1.5,
      depth: 1,
    });
    expect(result.success).toBe(false);
  });
});
