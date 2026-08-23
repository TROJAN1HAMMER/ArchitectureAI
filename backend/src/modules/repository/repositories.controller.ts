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
} from "@nestjs/swagger";
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
    const pageNum = page ? parseInt(page, 10) : 1;
    const perPageNum = perPage ? parseInt(perPage, 10) : 30;
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

  @Post(":repositoryId/sync")
  @ApiOperation({
    summary: "Trigger manual repository metadata synchronization",
  })
  @ApiResponse({
    status: 200,
    description: "Synchronization completed successfully",
  })
  async sync(
    @CurrentUser("id") userId: string,
    @Param("repositoryId") id: string,
  ) {
    return this.repositoriesService.syncRepositoryMetadata(userId, id);
  }
}
