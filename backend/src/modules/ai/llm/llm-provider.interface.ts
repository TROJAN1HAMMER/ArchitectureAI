export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMGenerationRequest {
  systemPrompt: string;
  userPrompt: string;
  context: string;
  conversationHistory?: LLMMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMGenerationResponse {
  content: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  finishReason?: string;
}

export interface ILLMProvider {
  generate(request: LLMGenerationRequest): Promise<LLMGenerationResponse>;
}
