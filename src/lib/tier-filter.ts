import type { UnderstandingFacet, UnderstandingDomain } from "@/lib/types";

/**
 * Domains that are NEVER exposed at surface tier, regardless of
 * depth or confidence. These domains contain inherently sensitive
 * information that should not be visible to casual connections.
 */
const SURFACE_EXCLUDED_DOMAINS: Set<UnderstandingDomain> = new Set([
  "struggles",
  "patterns",
]);

/**
 * Domains excluded at personal tier. Patterns can be exposed at
 * personal level, but struggles require deep access.
 */
const PERSONAL_EXCLUDED_DOMAINS: Set<UnderstandingDomain> = new Set([
  "struggles",
]);

/**
 * Filters facets by tier — this is a hard security boundary.
 *
 * surface: depth ≤ 2, confidence ≥ 0.7, excludes struggles + patterns
 * personal: depth ≤ 3, confidence ≥ 0.4, excludes struggles
 * deep: all facets
 */
export function filterFacetsByTier(
  facets: UnderstandingFacet[],
  tier: "surface" | "personal" | "deep"
): UnderstandingFacet[] {
  switch (tier) {
    case "surface":
      return facets.filter(
        (f) =>
          f.depth <= 2 &&
          f.confidence >= 0.7 &&
          !SURFACE_EXCLUDED_DOMAINS.has(f.domain)
      );
    case "personal":
      return facets.filter(
        (f) =>
          f.depth <= 3 &&
          f.confidence >= 0.4 &&
          !PERSONAL_EXCLUDED_DOMAINS.has(f.domain)
      );
    case "deep":
      return facets;
  }
}
