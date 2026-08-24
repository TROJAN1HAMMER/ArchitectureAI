import { z } from "zod";

export const environmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  JWT_SECRET: z.string().min(8),
  JWT_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  CORS_ALLOWED_ORIGINS: z.string().default("http://localhost:3000"),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL: z.string().url().optional(),
  GITHUB_OAUTH_ENCRYPTION_KEY: z.string().length(32).optional(),
  EMBEDDING_PROVIDER: z.string().default("mock"),
  EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  EMBEDDING_DIMENSIONS: z.coerce.number().default(1536),
  EMBEDDING_MAX_FILE_SIZE: z.coerce.number().default(524288),
  EMBEDDING_CHUNK_SIZE: z.coerce.number().default(1000),
  EMBEDDING_CHUNK_OVERLAP: z.coerce.number().default(200),
  LLM_PROVIDER: z.string().default("mock"),
  LLM_MODEL: z.string().default("mock-model"),
  LLM_API_KEY: z.string().optional(),
  LLM_BASE_URL: z.string().optional(),
  MAX_CONTEXT_CHARS: z.coerce.number().default(8000),
});

export type Environment = z.infer<typeof environmentSchema>;

export function validate(config: Record<string, unknown>) {
  const result = environmentSchema.safeParse(config);
  if (!result.success) {
    console.error("❌ Invalid environment configuration:");
    console.error(JSON.stringify(result.error.format(), null, 2));
    throw new Error("Invalid environment configuration");
  }
  return result.data;
}
