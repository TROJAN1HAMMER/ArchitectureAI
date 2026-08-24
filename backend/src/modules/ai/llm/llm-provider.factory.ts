import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ILLMProvider } from "./llm-provider.interface.js";
import { MockLLMProviderService } from "./mock-llm-provider.service.js";

@Injectable()
export class LLMProviderFactory {
  constructor(
    private readonly configService: ConfigService,
    private readonly mockProvider: MockLLMProviderService,
  ) {}

  getProvider(): ILLMProvider {
    const providerName =
      this.configService.get<string>("LLM_PROVIDER") || "mock";

    switch (providerName.toLowerCase()) {
      case "mock":
      default:
        return this.mockProvider;
    }
  }
}
