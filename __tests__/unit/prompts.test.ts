import { describe, it, expect } from "vitest";
import { buildQuestionerPrompt } from "@/lib/prompts/questioner";

describe("buildQuestionerPrompt", () => {
  it("builds a prompt for a first-time user with no understanding", () => {
    const prompt = buildQuestionerPrompt({
      facets: [],
      curiosityThreads: [],
      recentMessages: [],
    });

    expect(prompt).toContain("deeply curious presence");
    expect(prompt).toContain("Nothing yet. This is a new relationship.");
    expect(prompt).toContain("very first interaction");
    expect(prompt).toContain("Krista Tippett");
    expect(prompt).toContain("Ram Dass");
  });

  it("includes understanding facets when provided", () => {
    const prompt = buildQuestionerPrompt({
      facets: [
        {
          id: "1",
          domain: "values",
          content: "Deeply cares about environmental sustainability",
          confidence: 0.8,
          depth: 2,
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: "2",
          domain: "relationships",
          content: "Close bond with their daughter",
          confidence: 0.9,
          depth: 3,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ],
      recentMessages: [],
    });

    expect(prompt).toContain("environmental sustainability");
    expect(prompt).toContain("Close bond with their daughter");
    expect(prompt).toContain("[values]");
    expect(prompt).toContain("[relationships]");
  });

  it("includes curiosity threads when provided", () => {
    const prompt = buildQuestionerPrompt({
      facets: [],
      curiosityThreads: [
        "Explore their relationship with creativity",
        "Ask about their patent work",
      ],
      recentMessages: [],
    });

    expect(prompt).toContain("relationship with creativity");
    expect(prompt).toContain("patent work");
  });

  it("includes recent conversation history", () => {
    const prompt = buildQuestionerPrompt({
      facets: [],
      recentMessages: [
        { role: "agent", content: "What brings you joy?" },
        { role: "user", content: "My children laughing." },
      ],
    });

    expect(prompt).toContain("What brings you joy?");
    expect(prompt).toContain("My children laughing.");
    expect(prompt).toContain("You: What brings you joy?");
    expect(prompt).toContain("Them: My children laughing.");
  });

  it("always includes core principles", () => {
    const prompt = buildQuestionerPrompt({ facets: [] });

    expect(prompt).toContain("Ask ONE question at a time");
    expect(prompt).toContain("Never judge");
    expect(prompt).toContain("Respond with ONLY the question");
  });
});
