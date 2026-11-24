// Simulates a third-party LLM API so the workshop runs offline. Not part of the app.
// Shape follows Gemini's generateContent REST API; the answer comes from the mock provider.
import { Router } from 'express';
import { z } from 'zod';
import type { Config } from '../config.js';
import { createMockProvider } from '../providers/mock.js';

const PartsSchema = z.object({ parts: z.array(z.object({ text: z.string() })) });

const GenerateContentSchema = z.object({
  contents: z.array(PartsSchema.extend({ role: z.string().optional() })).min(1),
  systemInstruction: PartsSchema.optional(),
});

function joinParts(items: readonly z.infer<typeof PartsSchema>[]): string {
  return items.flatMap((item) => item.parts.map((part) => part.text)).join('\n');
}

export function fakeProviderRouter(config: Config): Router {
  const router = Router();
  const mock = createMockProvider({ scenario: config.mockScenario, slowMs: config.mockSlowMs });

  // Express 5 path syntax: the colon before generateContent is escaped (literal ":").
  router.post('/v1beta/models/:model\\:generateContent', async (req, res) => {
    const { key } = req.query;
    if (typeof key !== 'string' || key !== config.fakeProviderKey) {
      res.status(401).json({ error: { code: 401, message: 'API key not valid.' } });
      return;
    }

    const body = GenerateContentSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: { code: 400, message: 'Invalid generateContent request.' } });
      return;
    }

    const text = await mock.generate({
      system: body.data.systemInstruction ? joinParts([body.data.systemInstruction]) : '',
      user: joinParts(body.data.contents),
    });
    res.json({ candidates: [{ content: { role: 'model', parts: [{ text }] } }] });
  });

  return router;
}
