/** What every LLM adapter (mock, Gemini, OpenAI) implements. Returns the raw model text. */
export interface LlmProvider {
  generate(
    input: { system: string; user: string },
    options?: { signal?: AbortSignal },
  ): Promise<string>;
}

/** Thrown by real adapters when the provider answers with a non-2xx status. */
export class ProviderHttpError extends Error {
  override readonly name = 'ProviderHttpError';

  constructor(
    readonly provider: string,
    readonly status: number,
  ) {
    super(`${provider} request failed with HTTP ${String(status)}`);
  }
}

/** Thrown by real adapters when a 2xx response does not have the expected shape. */
export class ProviderResponseError extends Error {
  override readonly name = 'ProviderResponseError';

  constructor(readonly provider: string) {
    super(`${provider} returned an unexpected response shape`);
  }
}
