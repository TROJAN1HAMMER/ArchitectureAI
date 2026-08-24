import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { SemanticSearchService } from "./semantic-search.service.js";
import { SemanticIndexerService } from "./semantic-indexer.service.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";

@ApiTags("Semantic Search")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
@Controller("repositories/:repositoryId")
export class SemanticSearchController {
  constructor(
    private readonly semanticSearchService: SemanticSearchService,
    private readonly semanticIndexerService: SemanticIndexerService,
  ) {}

  @Get("search")
  @ApiOperation({
    summary: "Perform semantic similarity search over repository content",
  })
  @ApiQuery({
    name: "q",
    required: true,
    type: String,
    description: "Search query text",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Max results limit (default 10)",
  })
  @ApiResponse({ status: 200, description: "Ranked semantic search results" })
  async search(
    @CurrentUser("id") userId: string,
    @Param("repositoryId") repositoryId: string,
    @Query("q") q: string,
    @Query("limit") limit?: string,
  ) {
    if (!q || !q.trim()) {
      throw new BadRequestException("Query parameter 'q' is required");
    }
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.semanticSearchService.searchRepository(
      userId,
      repositoryId,
      q,
      limitNum,
    );
  }

  @Get("semantic-index")
  @ApiOperation({ summary: "Get semantic indexing status for repository" })
  @ApiResponse({ status: 200, description: "Indexing status details" })
  async getStatus(
    @CurrentUser("id") userId: string,
    @Param("repositoryId") repositoryId: string,
  ) {
    return this.semanticIndexerService.getIndexingStatus(userId, repositoryId);
  }

  @Post("semantic-index")
  @ApiOperation({ summary: "Trigger semantic indexing for repository" })
  @ApiResponse({ status: 200, description: "Semantic indexing triggered" })
  @ApiResponse({
    status: 409,
    description: "Semantic indexing already in progress",
  })
  async triggerIndexing(
    @CurrentUser("id") userId: string,
    @Param("repositoryId") repositoryId: string,
  ) {
    const result = await this.semanticIndexerService.indexRepository(
      userId,
      repositoryId,
    );
    return {
      repositoryId: result.repositoryId,
      status: "RUNNING",
      message: "Semantic indexing triggered successfully",
    };
  }
}
