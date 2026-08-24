import { Injectable } from "@nestjs/common";
import { RetrievedCandidate } from "./context-retriever.service.js";
import { ParsedQuery } from "./query-understanding.service.js";

export interface RankedContextItem {
  fileId: string | null;
  path: string;
  content: string;
  finalScore: number;
  semanticScore: number;
  graphScore: number;
  lexicalScore: number;
  graphConnections: Array<{ nodeName: string; type: string }>;
  metadata: any;
}

@Injectable()
export class ContextRankerService {
  private readonly SEMANTIC_WEIGHT = 0.6;
  private readonly GRAPH_WEIGHT = 0.25;
  private readonly LEXICAL_WEIGHT = 0.15;

  rankContext(
    candidates: RetrievedCandidate[],
    parsedQuery: ParsedQuery,
  ): RankedContextItem[] {
    if (!candidates || candidates.length === 0) {
      return [];
    }

    const keywords = parsedQuery.keywords || [];
    const rankedMap = new Map<string, RankedContextItem>();

    for (const cand of candidates) {
      // 1. Semantic score (0.0 to 1.0)
      const semanticScore = Math.min(1.0, Math.max(0.0, cand.semanticScore));

      // 2. Graph score: based on connection count and type match
      let graphScore = 0.0;
      if (cand.graphConnections && cand.graphConnections.length > 0) {
        graphScore = Math.min(1.0, cand.graphConnections.length * 0.25);
      }

      // 3. Lexical score: keyword matches in path and content
      let lexicalScore = 0.0;
      if (keywords.length > 0) {
        const pathLower = cand.path.toLowerCase();
        const contentLower = cand.content.toLowerCase();
        let matches = 0;

        for (const kw of keywords) {
          if (pathLower.includes(kw)) matches += 2;
          else if (contentLower.includes(kw)) matches += 1;
        }

        lexicalScore = Math.min(1.0, matches / (keywords.length * 2));
      }

      // 4. Combined final score
      const finalScore = parseFloat(
        (
          semanticScore * this.SEMANTIC_WEIGHT +
          graphScore * this.GRAPH_WEIGHT +
          lexicalScore * this.LEXICAL_WEIGHT
        ).toFixed(4),
      );

      const key = cand.fileId || cand.path;
      const existing = rankedMap.get(key);

      if (!existing || finalScore > existing.finalScore) {
        rankedMap.set(key, {
          fileId: cand.fileId,
          path: cand.path,
          content: cand.content,
          finalScore,
          semanticScore,
          graphScore,
          lexicalScore,
          graphConnections: cand.graphConnections,
          metadata: cand.metadata,
        });
      }
    }

    const results = Array.from(rankedMap.values());
    results.sort((a, b) => b.finalScore - a.finalScore);
    return results;
  }
}
