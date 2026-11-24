import { Router } from 'express';
import { z } from 'zod';
import { buildPrompt } from '../assistant/prompt.js';
import { getReport } from '../data/reports.js';
import { logger } from '../logger.js';
import type { LlmProvider } from '../providers/types.js';

const AssistantRequestSchema = z.object({
  question: z.string().min(1), // WORKSHOP(B): no max length (limit to 2,000 chars) and no format check.
  tenantId: z.string().min(1), // WORKSHOP(C): tenantId from the payload; take it from the session.
});

export function assistantRouter(provider: LlmProvider): Router {
  const router = Router();

  // WORKSHOP(A): no requireAuth and no rate limit on an endpoint that spends provider money.
  router.post('/', async (req, res) => {
    // WORKSHOP(D): logs every header (Authorization too, once auth exists) and the full body.
    logger.info('assistant request', { headers: req.headers, body: req.body as unknown });

    const body = AssistantRequestSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }

    // WORKSHOP(C): no assertCanRead: any caller can ask about any tenant (viewers included).
    const report = getReport(body.data.tenantId);
    if (!report) {
      res.status(404).json({ error: 'Unknown tenant' });
      return;
    }

    let raw: string;
    try {
      // WORKSHOP(A): no timeout: pass an AbortSignal and give up after config.assistantTimeoutMs.
      raw = await provider.generate(buildPrompt(report, body.data.question));
    } catch (error) {
      logger.error('provider failed', { name: error instanceof Error ? error.name : 'unknown' });
      res.status(502).json({ error: 'provider_error' });
      return;
    }

    // WORKSHOP(B): raw model text goes to the client unvalidated; parse it with InsightSchema.
    res.json({ raw });
  });

  return router;
}
