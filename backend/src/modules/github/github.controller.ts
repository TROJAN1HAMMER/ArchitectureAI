import { Controller, Get, Delete, Query, Res, UseGuards } from "@nestjs/common";
import { Response } from "express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { GithubService } from "./github.service.js";
import { GithubCallbackDto } from "./dto/github-callback.dto.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { ConfigService } from "@nestjs/config";

@ApiTags("GitHub")
@Controller("github")
export class GithubController {
  constructor(
    private readonly githubService: GithubService,
    private readonly configService: ConfigService,
  ) {}

  @Get("connect")
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Retrieve GitHub OAuth authorization URL" })
  @ApiResponse({
    status: 200,
    description: "Redirect URL returned successfully",
  })
  async connect(@CurrentUser("id") userId: string) {
    const url = await this.githubService.getConnectUrl(userId);
    return { url };
  }

  @Get("callback")
  @ApiOperation({ summary: "Handle GitHub OAuth callback and exchange tokens" })
  @ApiResponse({
    status: 302,
    description: "Redirects user back to frontend dashboard",
  })
  async callback(@Query() query: GithubCallbackDto, @Res() res: Response) {
    const frontendUrl =
      this.configService.get<string>("FRONTEND_URL") || "http://localhost:3000";
    try {
      await this.githubService.handleCallback(query.code, query.state);
      return res.redirect(`${frontendUrl}/repositories?connected=true`);
    } catch (err: any) {
      const message = encodeURIComponent(err.message || "Verification failed");
      return res.redirect(
        `${frontendUrl}/repositories?connected=false&error=${message}`,
      );
    }
  }

  @Get("account")
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get current connected GitHub account metadata" })
  @ApiResponse({ status: 200, description: "GitHub account information" })
  async getAccount(@CurrentUser("id") userId: string) {
    return this.githubService.getAccount(userId);
  }

  @Delete("account")
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Disconnect GitHub account connection" })
  @ApiResponse({ status: 200, description: "Disconnected successfully" })
  async disconnect(@CurrentUser("id") userId: string) {
    return this.githubService.disconnectAccount(userId);
  }
}
