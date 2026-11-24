// Real Google Gemini adapter (generateContent REST API). Not used by tests.
// The key is sent in a header, never in the URL, and is never logged.
import { z } from 'zod';
import { ProviderHttpError, ProviderResponseError, type LlmProvider } from './types.js';

const GeminiResponseSchema = z.object({
  candidates: z
    .array(z.object({ content: z.object({ parts: z.array(z.object({ text: z.string() })) }) }))
    .min(1),
});

export interface GeminiOptions {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export function createGeminiProvider(options: GeminiOptions): LlmProvider {
  const baseUrl = options.baseUrl ?? 'https://generativelanguage.googleapis.com';
  const url = `${baseUrl}/v1beta/models/${encodeURIComponent(options.model)}:generateContent`;

  return {
    async generate({ system, user }, callOptions) {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': options.apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
        signal: callOptions?.signal ?? null,
      });
      if (!response.ok) throw new ProviderHttpError('gemini', response.status);

      const parsed = GeminiResponseSchema.safeParse(await response.json());
      if (!parsed.success) throw new ProviderResponseError('gemini');
      return (parsed.data.candidates[0]?.content.parts ?? []).map((part) => part.text).join('');
    },
  };
}
