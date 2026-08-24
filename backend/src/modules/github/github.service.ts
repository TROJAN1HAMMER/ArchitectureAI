import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RedisService } from "../../common/redis/redis.service.js";
import { GithubClientService } from "./github-client.service.js";
import { encrypt, decrypt } from "../../common/utils/encryption.js";
import * as crypto from "crypto";

function isConfigured(value?: string): boolean {
  if (!value) return false;
  const val = value.trim();
  if (
    val === "" ||
    val === "dummy_client_id" ||
    val === "dummy_client_secret" ||
    val === "mock_github_client_id" ||
    val === "mock_github_client_secret" ||
    val.startsWith("YOUR_")
  ) {
    return false;
  }
  return true;
}

@Injectable()
export class GithubService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly githubClient: GithubClientService,
  ) {}

  async getConnectUrl(userId: string): Promise<string> {
    const clientId = this.configService.get<string>("GITHUB_CLIENT_ID");
    const clientSecret = this.configService.get<string>("GITHUB_CLIENT_SECRET");
    const redirectUri = this.configService.get<string>("GITHUB_CALLBACK_URL");

    if (
      !isConfigured(clientId) ||
      !isConfigured(clientSecret) ||
      !isConfigured(redirectUri)
    ) {
      throw new BadRequestException(
        "GitHub OAuth integration is not configured. Please set valid GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, and GITHUB_CALLBACK_URL in your backend environment variables (.env).",
      );
    }

    const state = crypto.randomBytes(24).toString("hex");
    const redisKey = `oauth:state:${state}`;

    const redis = this.redisService.getClient();
    await redis.set(redisKey, userId, "EX", 300);

    const scopes = ["repo", "user:email"].join(" ");
    const params = new URLSearchParams({
      client_id: clientId!,
      redirect_uri: redirectUri!,
      scope: scopes,
      state: state,
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async handleCallback(code: string, state: string) {
    const redisKey = `oauth:state:${state}`;
    const redis = this.redisService.getClient();
    const userId = await redis.get(redisKey);

    if (!userId) {
      throw new UnauthorizedException("OAuth state has expired or is invalid");
    }

    await redis.del(redisKey);

    const token = await this.githubClient.getAccessToken(code);
    const profile = await this.githubClient.getUser(token);
    const encryptedToken = encrypt(token);

    const account = await this.prisma.gitHubAccount.upsert({
      where: { userId },
      update: {
        githubUserId: profile.githubUserId,
        username: profile.username,
        email: profile.email,
        profileUrl: profile.profileUrl,
        encryptedAccessToken: encryptedToken,
      },
      create: {
        userId,
        githubUserId: profile.githubUserId,
        username: profile.username,
        email: profile.email,
        profileUrl: profile.profileUrl,
        encryptedAccessToken: encryptedToken,
      },
    });

    return account;
  }

  async getAccount(userId: string) {
    const account = await this.prisma.gitHubAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      return { connected: false };
    }

    return {
      connected: true,
      username: account.username,
      email: account.email,
      profileUrl: account.profileUrl,
      githubUserId: account.githubUserId,
      connectedAt: account.createdAt,
    };
  }

  async disconnectAccount(userId: string) {
    try {
      await this.prisma.gitHubAccount.delete({
        where: { userId },
      });
      return { success: true };
    } catch (err) {
      throw new BadRequestException(
        "GitHub account connection not found or cannot be disconnected",
      );
    }
  }

  async getDecryptedToken(userId: string): Promise<string> {
    const account = await this.prisma.gitHubAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      throw new BadRequestException("GitHub account is not connected");
    }

    return decrypt(account.encryptedAccessToken);
  }
}
