import { Injectable } from "@nestjs/common";
import { SemanticSearchService } from "../../semantic-search/semantic-search.service.js";
import { KnowledgeGraphService } from "../../knowledge-graph/knowledge-graph.service.js";
import { SemanticIndexerService } from "../../semantic-search/semantic-indexer.service.js";
import { ParsedQuery } from "./query-understanding.service.js";

export interface RetrievedCandidate {
  fileId: string | null;
  path: string;
  content: string;
  semanticScore: number;
  graphConnections: Array<{ nodeName: string; type: string }>;
  metadata: any;
}

@Injectable()
export class ContextRetrieverService {
  constructor(
    private readonly semanticSearchService: SemanticSearchService,
    private readonly knowledgeGraphService: KnowledgeGraphService,
    private readonly semanticIndexerService: SemanticIndexerService,
  ) {}

  async retrieveContext(
    userId: string,
    repositoryId: string,
    parsedQuery: ParsedQuery,
    limit = 10,
  ): Promise<RetrievedCandidate[]> {
    // 1. Ownership validation check
    await this.semanticIndexerService.verifyRepositoryOwnership(
      userId,
      repositoryId,
    );

    // 2. Semantic Search retrieval
    const searchRes = await this.semanticSearchService.searchRepository(
      userId,
      repositoryId,
      parsedQuery.normalizedQuery,
      limit,
    );

    if (!searchRes.results || searchRes.results.length === 0) {
      return [];
    }

    // 3. Knowledge Graph context enrichment
    const candidates: RetrievedCandidate[] = [];

    for (const item of searchRes.results) {
      const graphConnections: Array<{ nodeName: string; type: string }> = [];

      try {
        // Find graph node corresponding to this file path
        const res = await this.knowledgeGraphService.getNodes(
          userId,
          repositoryId,
          { search: item.path },
        );

        if (res && res.nodes && res.nodes.length > 0) {
          const targetNode = res.nodes[0];
          const neighborhood = await this.knowledgeGraphService.getNeighborhood(
            userId,
            repositoryId,
            targetNode.id,
            1,
          );

          if (neighborhood && neighborhood.connectedNodes) {
            for (const node of neighborhood.connectedNodes) {
              if (node.name) {
                graphConnections.push({
                  nodeName: node.name,
                  type: node.type,
                });
              }
            }
          }
        }
      } catch {
        // Non-fatal if graph query misses
      }

      candidates.push({
        fileId: item.fileId,
        path: item.path,
        content: item.content,
        semanticScore: item.score,
        graphConnections,
        metadata: item.metadata || {},
      });
    }

    return candidates;
  }
}
