import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { RepositoriesService } from "./repositories.service.js";
import { ConnectRepositoryDto } from "../github/dto/connect-repository.dto.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";

@ApiTags("Repositories")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
@Controller("repositories")
export class RepositoriesController {
  constructor(private readonly repositoriesService: RepositoriesService) {}

  @Get()
  @ApiOperation({ summary: "List repositories connected to current user" })
  @ApiResponse({ status: 200, description: "List of connected repositories" })
  async getConnected(@CurrentUser("id") userId: string) {
    return this.repositoriesService.getConnectedRepositories(userId);
  }

  @Get("github")
  @ApiOperation({ summary: "List available repositories from GitHub account" })
  @ApiResponse({
    status: 200,
    description: "List of available GitHub repositories",
  })
  async getAvailable(
    @CurrentUser("id") userId: string,
    @Query("page") page?: string,
    @Query("perPage") perPage?: string,
  ) {
    const rawPage = page ? parseInt(page, 10) : 1;
    const rawPerPage = perPage ? parseInt(perPage, 10) : 30;
    const pageNum = Math.min(Math.max(isNaN(rawPage) ? 1 : rawPage, 1), 100);
    const perPageNum = Math.min(
      Math.max(isNaN(rawPerPage) ? 30 : rawPerPage, 1),
      100,
    );

    return this.repositoriesService.getAvailableFromGithub(
      userId,
      pageNum,
      perPageNum,
    );
  }

  @Post(":repositoryId/connect")
  @ApiOperation({ summary: "Connect a GitHub repository" })
  @ApiResponse({
    status: 201,
    description: "Repository connected successfully",
  })
  async connect(
    @CurrentUser("id") userId: string,
    @Body() dto: ConnectRepositoryDto,
  ) {
    return this.repositoriesService.connectRepository(
      userId,
      dto.owner,
      dto.name,
    );
  }

  @Delete(":repositoryId/connect")
  @ApiOperation({ summary: "Disconnect a repository" })
  @ApiResponse({
    status: 200,
    description: "Repository disconnected successfully",
  })
  async disconnect(
    @CurrentUser("id") userId: string,
    @Param("repositoryId") id: string,
  ) {
    return this.repositoriesService.disconnectRepository(userId, id);
  }

  @Get(":repositoryId")
  @ApiOperation({ summary: "Get details for a specific repository" })
  @ApiResponse({
    status: 200,
    description: "Repository details and file count",
  })
  async getById(
    @CurrentUser("id") userId: string,
    @Param("repositoryId") id: string,
  ) {
    return this.repositoriesService.getRepositoryById(userId, id);
  }

  @Get(":repositoryId/syncs")
  @ApiOperation({ summary: "Get synchronization history for a repository" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Repository synchronization list" })
  async getSyncs(
    @CurrentUser("id") userId: string,
    @Param("repositoryId") id: string,
    @Query("limit") limit?: string,
  ) {
    const rawLimit = limit ? parseInt(limit, 10) : 10;
    const limitNum = Math.min(
      Math.max(isNaN(rawLimit) ? 10 : rawLimit, 1),
      100,
    );
    return this.repositoriesService.getRepositorySyncs(userId, id, limitNum);
  }

  @Get(":repositoryId/tree")
  @ApiOperation({ summary: "Get normalized file tree for a repository" })
  @ApiQuery({ name: "path", required: false, type: String })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Repository file tree" })
  async getTree(
    @CurrentUser("id") userId: string,
    @Param("repositoryId") id: string,
    @Query("path") path?: string,
    @Query("limit") limit?: string,
  ) {
    const rawLimit = limit ? parseInt(limit, 10) : 100;
    const limitNum = Math.min(
      Math.max(isNaN(rawLimit) ? 100 : rawLimit, 1),
      500,
    );
    return this.repositoriesService.getRepositoryTree(
      userId,
      id,
      path,
      limitNum,
    );
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post(":repositoryId/sync")
  @ApiOperation({
    summary: "Trigger manual repository metadata and file tree synchronization",
  })
  @ApiResponse({
    status: 200,
    description: "Synchronization triggered successfully",
  })
  @ApiResponse({
    status: 409,
    description: "Synchronization already in progress",
  })
  async sync(
    @CurrentUser("id") userId: string,
    @Param("repositoryId") id: string,
  ) {
    return this.repositoriesService.syncRepositoryMetadata(userId, id);
  }
}
