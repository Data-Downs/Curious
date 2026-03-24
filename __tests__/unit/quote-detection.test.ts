import { describe, it, expect } from "vitest";
import {
  containsVerbatimQuote,
  containsFirstPersonLanguage,
  validateFacetPrivacy,
} from "@/lib/quote-detection";

describe("containsVerbatimQuote", () => {
  it("detects a 5-word verbatim quote", () => {
    const facet = "They carry anxiety about their financial security and housing situation";
    const messages = ["I carry anxiety about my financial security and I don't know what to do"];
    // "carry anxiety about my financial" -> "carry anxiety about their financial" won't match
    // But let's use an exact match
    const facet2 = "They said I don't know what to do about it";
    expect(containsVerbatimQuote(facet2, messages)).toBe(true);
  });

  it("allows genuinely interpreted content", () => {
    const facet = "Demonstrates deep concern about long-term housing stability";
    const messages = ["I'm really worried about whether we can afford to stay in our flat"];
    expect(containsVerbatimQuote(facet, messages)).toBe(false);
  });

  it("handles short messages that don't form 5-grams", () => {
    const facet = "Values family connection";
    const messages = ["My family matters"];
    expect(containsVerbatimQuote(facet, messages)).toBe(false);
  });

  it("handles empty inputs", () => {
    expect(containsVerbatimQuote("some content", [])).toBe(false);
    expect(containsVerbatimQuote("", ["some message"])).toBe(false);
  });
});

describe("containsFirstPersonLanguage", () => {
  it("detects first-person statements", () => {
    expect(containsFirstPersonLanguage("I feel like things are getting better")).toBe(true);
    expect(containsFirstPersonLanguage("I think the world is changing")).toBe(true);
    expect(containsFirstPersonLanguage("My mother always told me to be kind")).toBe(true);
  });

  it("allows third-person interpreted content", () => {
    expect(containsFirstPersonLanguage("Carries a strong sense of duty toward family")).toBe(false);
    expect(containsFirstPersonLanguage("Demonstrates genuine curiosity about systems")).toBe(false);
    expect(containsFirstPersonLanguage("Values discipline as identity, not just habit")).toBe(false);
  });
});

describe("validateFacetPrivacy", () => {
  it("rejects content exceeding 500 characters", () => {
    const longContent = "a".repeat(501);
    expect(validateFacetPrivacy(longContent, [])).toBe("Facet content exceeds maximum length (500 chars)");
  });

  it("rejects first-person language", () => {
    const result = validateFacetPrivacy("I believe in fairness above all else", []);
    expect(result).toBe("Contains first-person language suggesting raw quote");
  });

  it("accepts clean interpreted content", () => {
    const result = validateFacetPrivacy(
      "Places high value on fairness and systemic equity",
      ["I think fairness is the most important thing"]
    );
    expect(result).toBeNull();
  });
});
