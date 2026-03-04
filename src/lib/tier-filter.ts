import type { UnderstandingFacet } from "@/lib/types";

/**
 * Filters facets by tier — this is a hard security boundary.
 * surface: depth ≤ 2, confidence ≥ 0.7
 * personal: depth ≤ 3, confidence ≥ 0.4
 * deep: all facets
 */
export function filterFacetsByTier(
  facets: UnderstandingFacet[],
  tier: "surface" | "personal" | "deep"
): UnderstandingFacet[] {
  switch (tier) {
    case "surface":
      return facets.filter((f) => f.depth <= 2 && f.confidence >= 0.7);
    case "personal":
      return facets.filter((f) => f.depth <= 3 && f.confidence >= 0.4);
    case "deep":
      return facets;
  }
}
