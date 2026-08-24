import { z } from "zod";

export const environmentSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    PORT: z.coerce.number().default(3001),
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
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    RATE_LIMIT_TTL: z.coerce.number().default(60),
    RATE_LIMIT_LIMIT: z.coerce.number().default(100),
    OTEL_ENABLED: z.coerce.boolean().default(false),
    OTEL_SERVICE_NAME: z.string().default("architectai-backend"),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().default("http://localhost:4318"),
    MAX_REQUEST_BODY_SIZE: z.string().default("10mb"),
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
  })
  .refine(
    (data) => {
      if (data.NODE_ENV === "production") {
        if (data.CORS_ALLOWED_ORIGINS === "*") {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "Wildcard CORS origin '*' is strictly prohibited in production mode.",
      path: ["CORS_ALLOWED_ORIGINS"],
    },
  );

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
