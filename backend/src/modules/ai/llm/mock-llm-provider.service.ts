import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ILLMProvider,
  LLMGenerationRequest,
  LLMGenerationResponse,
} from "./llm-provider.interface.js";

@Injectable()
export class MockLLMProviderService implements ILLMProvider {
  constructor(private readonly configService: ConfigService) {}

  async generate(
    request: LLMGenerationRequest,
  ): Promise<LLMGenerationResponse> {
    const { userPrompt, context } = request;
    const model =
      request.model ||
      this.configService.get<string>("LLM_MODEL") ||
      "mock-architect-v1";

    // 1. Check for insufficient context indicator
    if (
      !context ||
      !context.trim() ||
      context.includes("No relevant repository files found")
    ) {
      return {
        content:
          "I couldn't find enough relevant evidence in this repository to answer that question reliably.",
        model,
        provider: "mock",
        finishReason: "stop",
        usage: { promptTokens: 50, completionTokens: 20, totalTokens: 70 },
      };
    }

    // 2. Extract paths present in the context block
    const pathMatches = Array.from(context.matchAll(/Path:\s*([^\n]+)/g)).map(
      (m) => m[1].trim(),
    );
    const uniquePaths = Array.from(new Set(pathMatches));

    // 3. Generate deterministic grounded response
    let responseText = `Based on the repository context retrieved for "${userPrompt}":\n\n`;

    if (uniquePaths.length > 0) {
      responseText += `The primary repository evidence is implemented across the following source paths:\n`;
      uniquePaths.forEach((path, idx) => {
        responseText += `${idx + 1}. \`${path}\`\n`;
      });
      responseText += `\nKey details extracted from context:\n`;

      // Extract first few lines of content for summary
      const codeSnippets = context
        .split(/\[Source \d+\]/)
        .filter(Boolean)
        .slice(0, 3);

      codeSnippets.forEach((snippet) => {
        const pathMatch = snippet.match(/Path:\s*([^\n]+)/);
        const path = pathMatch ? pathMatch[1].trim() : "source file";
        responseText += `- In \`${path}\`, relevant structure and functions define module behavior.\n`;
      });
    } else {
      responseText += `The retrieved repository context provides structural details relevant to your request.\n`;
    }

    return {
      content: responseText.trim(),
      model,
      provider: "mock",
      finishReason: "stop",
      usage: {
        promptTokens: Math.floor(context.length / 4),
        completionTokens: Math.floor(responseText.length / 4),
        totalTokens: Math.floor((context.length + responseText.length) / 4),
      },
    };
  }
}
