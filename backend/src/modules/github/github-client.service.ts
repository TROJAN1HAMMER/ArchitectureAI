import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Octokit } from "octokit";

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
export class GithubClientService {
  constructor(private readonly configService: ConfigService) {}

  async getAccessToken(code: string): Promise<string> {
    const clientId = this.configService.get<string>("GITHUB_CLIENT_ID");
    const clientSecret = this.configService.get<string>("GITHUB_CLIENT_SECRET");

    if (!isConfigured(clientId) || !isConfigured(clientSecret)) {
      throw new BadRequestException(
        "GitHub OAuth integration is not configured. Please set valid GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in backend environment variables (.env).",
      );
    }

    try {
      const response = await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code,
          }),
        },
      );

      const data = (await response.json()) as any;
      if (data.error) {
        throw new Error(data.error_description || data.error);
      }

      if (!data.access_token) {
        throw new Error("No access token returned from GitHub");
      }

      return data.access_token;
    } catch (err: any) {
      throw new BadRequestException(
        `GitHub OAuth exchange failed: ${err.message}`,
      );
    }
  }

  async getUser(token: string) {
    try {
      const octokit = new Octokit({ auth: token });
      const { data } = await octokit.rest.users.getAuthenticated();
      return {
        githubUserId: data.id.toString(),
        username: data.login,
        email: data.email || null,
        profileUrl: data.html_url,
      };
    } catch (err: any) {
      throw new BadRequestException(
        `Failed to retrieve GitHub user: ${err.message}`,
      );
    }
  }

  async getRepositories(token: string, page = 1, perPage = 30) {
    try {
      const octokit = new Octokit({ auth: token });
      const { data } = await octokit.rest.repos.listForAuthenticatedUser({
        sort: "updated",
        direction: "desc",
        page,
        per_page: perPage,
      });

      return data.map((repo: any) => ({
        githubRepositoryId: repo.id.toString(),
        name: repo.name,
        fullName: repo.full_name,
        ownerLogin: repo.owner.login,
        description: repo.description || null,
        htmlUrl: repo.html_url,
        defaultBranch: repo.default_branch || "main",
        visibility: repo.visibility || "public",
        isPrivate: repo.private,
      }));
    } catch (err: any) {
      throw new BadRequestException(
        `Failed to fetch GitHub repositories: ${err.message}`,
      );
    }
  }

  async getRepository(token: string, owner: string, repo: string) {
    try {
      const octokit = new Octokit({ auth: token });
      const { data } = await octokit.rest.repos.get({
        owner,
        repo,
      });

      return {
        githubRepositoryId: data.id.toString(),
        name: data.name,
        fullName: data.full_name,
        ownerLogin: data.owner.login,
        description: data.description || null,
        htmlUrl: data.html_url,
        defaultBranch: data.default_branch || "main",
        visibility: data.visibility || "public",
        isPrivate: data.private,
        language: data.language || null,
        stargazersCount: data.stargazers_count || 0,
        forksCount: data.forks_count || 0,
        archived: data.archived || false,
      };
    } catch (err: any) {
      throw new BadRequestException(
        `Failed to retrieve GitHub repository: ${err.message}`,
      );
    }
  }

  async getRepositoryTree(
    token: string,
    owner: string,
    repo: string,
    branch: string,
  ) {
    try {
      const octokit = new Octokit({ auth: token });
      const { data } = await octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: branch,
        recursive: "1",
      });

      if (!data.tree || !Array.isArray(data.tree)) {
        return [];
      }

      return data.tree
        .filter(
          (item: any) =>
            item.path && (item.type === "blob" || item.type === "tree"),
        )
        .map((item: any) => {
          const filePath: string = item.path;
          const lastSlash = filePath.lastIndexOf("/");
          const name =
            lastSlash >= 0 ? filePath.substring(lastSlash + 1) : filePath;
          const parentPath =
            lastSlash >= 0 ? filePath.substring(0, lastSlash) : null;
          const lastDot = name.lastIndexOf(".");
          const extension =
            lastDot > 0 ? name.substring(lastDot).toLowerCase() : null;

          return {
            path: filePath,
            name,
            extension,
            parentPath,
            type: item.type === "tree" ? "tree" : "blob",
            sha: item.sha,
            size: item.size || 0,
          };
        });
    } catch (err: any) {
      throw new BadRequestException(
        `Failed to retrieve GitHub repository tree: ${err.message}`,
      );
    }
  }
}
