import { z } from "zod";

export const environmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(8),
  JWT_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  CORS_ALLOWED_ORIGINS: z.string().default("http://localhost:3000"),
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
