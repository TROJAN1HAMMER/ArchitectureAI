import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Octokit } from "octokit";

@Injectable()
export class GithubClientService {
  constructor(private readonly configService: ConfigService) {}

  async getAccessToken(code: string): Promise<string> {
    const clientId = this.configService.get<string>("GITHUB_CLIENT_ID");
    const clientSecret = this.configService.get<string>("GITHUB_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      throw new BadRequestException("GitHub client configuration is missing");
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
          const pathParts = item.path.split("/");
          const name = pathParts[pathParts.length - 1];
          const parentPath =
            pathParts.length > 1 ? pathParts.slice(0, -1).join("/") : null;

          let extension: string | null = null;
          if (item.type === "blob" && name.includes(".")) {
            const extParts = name.split(".");
            if (extParts.length > 1) {
              extension = extParts[extParts.length - 1].toLowerCase();
            }
          }

          return {
            path: item.path,
            name,
            extension,
            size: item.size || 0,
            sha: item.sha || "",
            type: item.type === "tree" ? "tree" : "blob",
            parentPath,
          };
        });
    } catch (err: any) {
      throw new BadRequestException(
        `Failed to retrieve GitHub repository tree: ${err.message}`,
      );
    }
  }

  async getFileContent(
    token: string,
    owner: string,
    repo: string,
    path: string,
    ref?: string,
  ) {
    try {
      const octokit = new Octokit({ auth: token });
      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });
      return data;
    } catch (err: any) {
      throw new BadRequestException(
        `Failed to retrieve GitHub file content: ${err.message}`,
      );
    }
  }
}
