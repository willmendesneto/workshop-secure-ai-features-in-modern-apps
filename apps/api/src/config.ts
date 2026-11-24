// The ONLY file in the API that reads process.env. Everything else receives a Config object.
// `npm run dev` / `npm start` load the repo-root .env (if present) via Node's --env-file-if-exists.
import { z } from 'zod';

// Empty strings (e.g. `GEMINI_API_KEY=` copied from .env.example) count as "not set".
const optionalString = z
  .string()
  .optional()
  .transform((value) => (value === undefined || value.trim() === '' ? undefined : value));

export const MockScenarioSchema = z.enum(['ok', 'malformed', 'injection-echo', 'slow']);
export type MockScenario = z.infer<typeof MockScenarioSchema>;

const EnvSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  // Loopback only by default: the API is not reachable from other machines on the network.
  HOST: z.string().min(1).default('127.0.0.1'),
  AUTH_SECRET: z.string().min(1).default('dev-only-secret-change-me'),
  PROVIDER: z.enum(['mock', 'gemini', 'openai']).default('mock'),
  MOCK_SCENARIO: MockScenarioSchema.default('ok'),
  MOCK_SLOW_MS: z.coerce.number().int().min(0).default(15_000),
  // Demo key accepted by the simulated provider (/fake-provider). Fake on purpose: wsk_demo_ prefix.
  FAKE_PROVIDER_KEY: z.string().min(1).default('wsk_demo_7f3a9c1e5b2d4f60'),
  ASSISTANT_TIMEOUT_MS: z.coerce.number().int().min(1).default(10_000),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1).default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(10),
  GEMINI_API_KEY: optionalString,
  GEMINI_MODEL: z.string().min(1).default('gemini-2.5-flash'),
  OPENAI_API_KEY: optionalString,
  OPENAI_MODEL: z.string().min(1).default('gpt-4.1-mini'),
});

export interface Config {
  port: number;
  host: string;
  authSecret: string;
  provider: 'mock' | 'gemini' | 'openai';
  mockScenario: MockScenario;
  /** How long the `slow` mock scenario waits before answering. */
  mockSlowMs: number;
  /** Key the simulated third-party provider expects in `?key=`. */
  fakeProviderKey: string;
  /** Provider calls are aborted after this many milliseconds (504 for the client). */
  assistantTimeoutMs: number;
  /** Assistant requests allowed per user in each window (429 above it). */
  rateLimit: { windowMs: number; max: number };
  geminiApiKey: string | undefined;
  geminiModel: string;
  openaiApiKey: string | undefined;
  openaiModel: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = EnvSchema.parse(env);
  return {
    port: parsed.PORT,
    host: parsed.HOST,
    authSecret: parsed.AUTH_SECRET,
    provider: parsed.PROVIDER,
    mockScenario: parsed.MOCK_SCENARIO,
    mockSlowMs: parsed.MOCK_SLOW_MS,
    fakeProviderKey: parsed.FAKE_PROVIDER_KEY,
    assistantTimeoutMs: parsed.ASSISTANT_TIMEOUT_MS,
    rateLimit: { windowMs: parsed.RATE_LIMIT_WINDOW_MS, max: parsed.RATE_LIMIT_MAX },
    geminiApiKey: parsed.GEMINI_API_KEY,
    geminiModel: parsed.GEMINI_MODEL,
    openaiApiKey: parsed.OPENAI_API_KEY,
    openaiModel: parsed.OPENAI_MODEL,
  };
}
