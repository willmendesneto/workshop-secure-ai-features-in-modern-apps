// Real OpenAI adapter (Chat Completions API). Not used by tests.
// The key is sent as a bearer header and is never logged.
import { z } from 'zod';
import { ProviderHttpError, ProviderResponseError, type LlmProvider } from './types.js';

const ChatCompletionSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string() }) })).min(1),
});

export interface OpenAiOptions {
  apiKey: string;
  model: string;
}

export function createOpenAiProvider(options: OpenAiOptions): LlmProvider {
  const url = 'https://api.openai.com/v1/chat/completions';

  return {
    async generate({ system, user }, callOptions) {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${options.apiKey}`,
        },
        body: JSON.stringify({
          model: options.model,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
        signal: callOptions?.signal ?? null,
      });
      if (!response.ok) throw new ProviderHttpError('openai', response.status);

      const parsed = ChatCompletionSchema.safeParse(await response.json());
      if (!parsed.success) throw new ProviderResponseError('openai');
      return parsed.data.choices[0]?.message.content ?? '';
    },
  };
}
