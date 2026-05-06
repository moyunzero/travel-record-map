/// <reference types="node" />
import { z } from "zod";
import tryParseEnv from "./try-parse-env";

const envSchema = z.object({
  NODE_ENV: z.string(),
  TURSO_DATABASE_URL: z.string(),
  TURSO_AUTH_TOKEN: z.string(),
  BETTER_AUTH_SECRET: z.string(),
  BETTER_AUTH_URL: z.string(),
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  S3_ENDPOINT: z.string(),
  S3_BUCKET: z.string(),
  S3_REGION: z.string(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
});

export type EnvSchema = z.infer<typeof envSchema>;

tryParseEnv(envSchema);

export default envSchema.parse(process.env);
