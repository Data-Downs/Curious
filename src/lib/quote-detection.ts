/**
 * Server-side quote detection.
 *
 * Compares facet content against the original transcript to detect
 * verbatim or near-verbatim quotes that the LLM should have interpreted
 * but didn't. This is the hard boundary behind the soft LLM instruction.
 */

/**
 * Extracts all n-grams of length `n` words from a string.
 */
function extractNgrams(text: string, n: number): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  const ngrams = new Set<string>();
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.add(words.slice(i, i + n).join(" "));
  }
  return ngrams;
}

/**
 * Checks if a facet's content contains verbatim quotes from the transcript.
 * Returns true if the content appears to contain raw quotes (i.e. is unsafe).
 *
 * Uses 5-gram matching: if any sequence of 5+ consecutive words from the
 * user's messages appears in the facet content, it's flagged.
 *
 * Only checks against user messages (not agent messages), since agent
 * messages are generated and not private.
 */
export function containsVerbatimQuote(
  facetContent: string,
  userMessages: string[],
  ngramSize: number = 5
): boolean {
  if (userMessages.length === 0) return false;

  const facetNgrams = extractNgrams(facetContent, ngramSize);
  if (facetNgrams.size === 0) return false;

  for (const message of userMessages) {
    const messageNgrams = extractNgrams(message, ngramSize);
    for (const ngram of messageNgrams) {
      if (facetNgrams.has(ngram)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Checks if facet content contains first-person language that suggests
 * it's a raw quote rather than interpreted understanding.
 * E.g., "I feel like my mother never..." vs "Carries unresolved tension with maternal figure"
 */
export function containsFirstPersonLanguage(facetContent: string): boolean {
  const firstPersonPatterns = [
    /^I\s/i,
    /\bI\s+(feel|think|believe|want|need|love|hate|wish|hope|know|remember|am|was|have|had|do|did|can|could|would|should|might)\b/i,
    /\bmy\s+(mum|mom|dad|father|mother|brother|sister|wife|husband|partner|son|daughter|friend|boss|teacher)\b/i,
  ];

  return firstPersonPatterns.some((pattern) => pattern.test(facetContent));
}

/**
 * Validates a facet's content for privacy safety.
 * Returns null if safe, or a string describing the issue if not.
 */
export function validateFacetPrivacy(
  facetContent: string,
  userMessages: string[]
): string | null {
  if (containsVerbatimQuote(facetContent, userMessages)) {
    return "Contains verbatim quote from transcript";
  }

  if (containsFirstPersonLanguage(facetContent)) {
    return "Contains first-person language suggesting raw quote";
  }

  if (facetContent.length > 500) {
    return "Facet content exceeds maximum length (500 chars)";
  }

  return null;
}
