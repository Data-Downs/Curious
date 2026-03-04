import { UNDERSTANDING_DOMAINS, type UnderstandingDomain, type UnderstandingFacet } from "@/lib/types";

interface DomainMetrics {
  domain: UnderstandingDomain;
  facetCount: number;
  avgConfidence: number;
  maxDepth: number;
}

interface ExplorationPriority {
  domain: UnderstandingDomain;
  priority: number; // 0-1, higher = more exploration needed
  reason: string;
}

export function analyzeDomainCoverage(
  facets: UnderstandingFacet[]
): DomainMetrics[] {
  return UNDERSTANDING_DOMAINS.map((domain) => {
    const domainFacets = facets.filter((f) => f.domain === domain);
    const count = domainFacets.length;
    const avgConfidence =
      count > 0
        ? domainFacets.reduce((sum, f) => sum + f.confidence, 0) / count
        : 0;
    const maxDepth =
      count > 0 ? Math.max(...domainFacets.map((f) => f.depth)) : 0;

    return {
      domain,
      facetCount: count,
      avgConfidence,
      maxDepth,
    };
  });
}

export function suggestExplorationPriority(
  facets: UnderstandingFacet[]
): ExplorationPriority[] {
  const coverage = analyzeDomainCoverage(facets);
  const totalFacets = facets.length;

  return coverage
    .map((metrics) => {
      let priority = 0;
      let reason = "";

      if (metrics.facetCount === 0) {
        // Completely unexplored
        priority = 1.0;
        reason = "Unexplored territory";
      } else if (metrics.facetCount === 1) {
        // Only surface-level
        priority = 0.8;
        reason = "Only touched once";
      } else if (metrics.maxDepth <= 2 && metrics.avgConfidence < 0.5) {
        // Shallow understanding
        priority = 0.7;
        reason = "Shallow understanding, low confidence";
      } else if (metrics.maxDepth <= 3 && totalFacets > 10) {
        // Hasn't deepened despite overall progress
        priority = 0.5;
        reason = "Could go deeper";
      } else if (metrics.avgConfidence >= 0.7 && metrics.maxDepth >= 4) {
        // Well understood — lower priority
        priority = 0.15;
        reason = "Well explored";
      } else {
        // Moderate understanding
        priority = 0.35;
        reason = "Moderate understanding";
      }

      return {
        domain: metrics.domain,
        priority,
        reason,
      };
    })
    .sort((a, b) => b.priority - a.priority);
}
