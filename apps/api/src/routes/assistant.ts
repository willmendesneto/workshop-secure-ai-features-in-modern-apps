import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { buildPrompt } from '../assistant/prompt.js';
import { requireAuth, sessionUser } from '../auth/require-auth.js';
import type { Config } from '../config.js';
import { getReport } from '../data/reports.js';
import { logger } from '../logger.js';
import type { LlmProvider } from '../providers/types.js';

const AssistantRequestSchema = z.object({
  question: z.string().min(1), // WORKSHOP(B): no max length (limit to 2,000 chars) and no format check.
  tenantId: z.string().min(1), // WORKSHOP(C): tenantId from the payload; take it from the session.
});

type AssistantConfig = Pick<Config, 'authSecret' | 'assistantTimeoutMs' | 'rateLimit'>;

export function assistantRouter(provider: LlmProvider, config: AssistantConfig): Router {
  const router = Router();

  // Per user, not per IP: runs after requireAuth, so the session user is always there.
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    limit: config.rateLimit.max,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: (_req, res) => sessionUser(res).userId,
    handler: (_req, res) => {
      res.status(429).json({ error: 'rate_limited' });
    },
  });

  router.post('/', requireAuth(config.authSecret), limiter, async (req, res) => {
    // WORKSHOP(D): logs every header (Authorization included) and the full body.
    logger.info('assistant request', { headers: req.headers, body: req.body as unknown });

    const body = AssistantRequestSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }

    // WORKSHOP(C): no assertCanRead: any signed-in user can ask about any tenant (viewers included).
    const report = getReport(body.data.tenantId);
    if (!report) {
      res.status(404).json({ error: 'Unknown tenant' });
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, config.assistantTimeoutMs);
    let raw: string;
    try {
      raw = await provider.generate(buildPrompt(report, body.data.question), {
        signal: controller.signal,
      });
    } catch (error) {
      const name = error instanceof Error ? error.name : 'unknown';
      logger.error('provider failed', { name });
      if (name === 'AbortError') {
        res.status(504).json({ error: 'timeout' });
      } else {
        res.status(502).json({ error: 'provider_error' });
      }
      return;
    } finally {
      clearTimeout(timer);
    }

    // WORKSHOP(B): raw model text goes to the client unvalidated; parse it with InsightSchema.
    res.json({ raw });
  });

  return router;
}
