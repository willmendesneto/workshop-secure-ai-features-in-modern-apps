import type { Config } from '../config.js';
import { createGeminiProvider } from './gemini.js';
import { createMockProvider } from './mock.js';
import { createOpenAiProvider } from './openai.js';
import type { LlmProvider } from './types.js';

export type { LlmProvider } from './types.js';

/** Picks the provider from config. Fails fast when a real provider has no key. */
export function createProvider(config: Config): LlmProvider {
  switch (config.provider) {
    case 'mock':
      return createMockProvider({ scenario: config.mockScenario, slowMs: config.mockSlowMs });
    case 'gemini':
      if (!config.geminiApiKey) {
        throw new Error('PROVIDER=gemini needs GEMINI_API_KEY in the server environment (.env).');
      }
      return createGeminiProvider({ apiKey: config.geminiApiKey, model: config.geminiModel });
    case 'openai':
      if (!config.openaiApiKey) {
        throw new Error('PROVIDER=openai needs OPENAI_API_KEY in the server environment (.env).');
      }
      return createOpenAiProvider({ apiKey: config.openaiApiKey, model: config.openaiModel });
  }
}
