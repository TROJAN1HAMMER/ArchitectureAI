import { Injectable } from "@nestjs/common";
import { NodeType, EdgeType } from "@prisma/client";

export type QueryIntent = "architecture" | "security" | "general";

export interface ParsedQuery {
  normalizedQuery: string;
  keywords: string[];
  intent: QueryIntent;
  likelyNodeTypes: NodeType[];
  likelyEdgeTypes: EdgeType[];
}

@Injectable()
export class QueryUnderstandingService {
  parseQuery(rawQuery: string): ParsedQuery {
    const normalizedQuery = (rawQuery || "").trim();
    const lower = normalizedQuery.toLowerCase();

    // Extract keywords (words > 2 characters, excluding common stop words)
    const stopWords = new Set([
      "the",
      "and",
      "how",
      "what",
      "where",
      "which",
      "this",
      "that",
      "does",
      "work",
      "are",
      "is",
      "for",
      "in",
      "with",
    ]);
    const tokens = lower.split(/[^a-z0-9_.-]+/i).filter((t) => t.length > 2);
    const keywords = Array.from(
      new Set(tokens.filter((t) => !stopWords.has(t))),
    );

    let intent: QueryIntent = "general";
    const likelyNodeTypes = new Set<NodeType>([NodeType.FILE, NodeType.MODULE]);
    const likelyEdgeTypes = new Set<EdgeType>([
      EdgeType.CONTAINS,
      EdgeType.IMPORTS,
    ]);

    // Intent Heuristics
    if (
      lower.includes("auth") ||
      lower.includes("jwt") ||
      lower.includes("password") ||
      lower.includes("secret") ||
      lower.includes("token") ||
      lower.includes("permission") ||
      lower.includes("guard") ||
      lower.includes("security")
    ) {
      intent = "security";
      likelyNodeTypes.add(NodeType.FILE);
      likelyNodeTypes.add(NodeType.CLASS);
      likelyNodeTypes.add(NodeType.FUNCTION);
      likelyEdgeTypes.add(EdgeType.DEPENDS_ON);
      likelyEdgeTypes.add(EdgeType.USES);
    } else if (
      lower.includes("architecture") ||
      lower.includes("structure") ||
      lower.includes("component") ||
      lower.includes("overview") ||
      lower.includes("design") ||
      lower.includes("topology") ||
      lower.includes("module")
    ) {
      intent = "architecture";
      likelyNodeTypes.add(NodeType.REPOSITORY);
      likelyNodeTypes.add(NodeType.DIRECTORY);
      likelyNodeTypes.add(NodeType.MODULE);
      likelyNodeTypes.add(NodeType.COMPONENT);
      likelyEdgeTypes.add(EdgeType.CONTAINS);
      likelyEdgeTypes.add(EdgeType.IMPORTS);
      likelyEdgeTypes.add(EdgeType.DEPENDS_ON);
    }

    return {
      normalizedQuery,
      keywords,
      intent,
      likelyNodeTypes: Array.from(likelyNodeTypes),
      likelyEdgeTypes: Array.from(likelyEdgeTypes),
    };
  }
}
