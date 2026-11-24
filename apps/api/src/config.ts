// The ONLY file in the API that reads process.env. Everything else receives a Config object.
import { z } from 'zod';

// Empty strings (e.g. `GEMINI_API_KEY=` copied from .env.example) count as "not set".
const optionalString = z
  .string()
  .optional()
  .transform((value) => (value === undefined || value.trim() === '' ? undefined : value));

const EnvSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  AUTH_SECRET: z.string().min(1).default('dev-only-secret-change-me'),
  PROVIDER: z.enum(['mock', 'gemini', 'openai']).default('mock'),
  MOCK_SCENARIO: z.string().min(1).default('ok'),
  GEMINI_API_KEY: optionalString,
  GEMINI_MODEL: z.string().min(1).default('gemini-2.5-flash'),
  OPENAI_API_KEY: optionalString,
  OPENAI_MODEL: z.string().min(1).default('gpt-4.1-mini'),
});

export interface Config {
  port: number;
  authSecret: string;
  provider: 'mock' | 'gemini' | 'openai';
  mockScenario: string;
  geminiApiKey: string | undefined;
  geminiModel: string;
  openaiApiKey: string | undefined;
  openaiModel: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = EnvSchema.parse(env);
  return {
    port: parsed.PORT,
    authSecret: parsed.AUTH_SECRET,
    provider: parsed.PROVIDER,
    mockScenario: parsed.MOCK_SCENARIO,
    geminiApiKey: parsed.GEMINI_API_KEY,
    geminiModel: parsed.GEMINI_MODEL,
    openaiApiKey: parsed.OPENAI_API_KEY,
    openaiModel: parsed.OPENAI_MODEL,
  };
}
