import {
  AskRequestSchema,
  type AssistantFailure,
  type AssistantSuccess,
  InsightSchema,
  type SessionUser,
} from '@workshop/contracts';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { buildPrompt } from '../assistant/prompt.js';
import { assertCanRead } from '../auth/authorize.js';
import { requireAuth, sessionUser } from '../auth/require-auth.js';
import type { Config } from '../config.js';
import { getReport } from '../data/reports.js';
import { logger } from '../logger.js';
import type { LlmProvider } from '../providers/types.js';

// tenantId is optional and only compared to the session: a different one is tampering (403).
const AssistantRequestSchema = AskRequestSchema.extend({
  tenantId: z.string().min(1).optional(),
});

const INVALID_OUTPUT: AssistantFailure = {
  error: 'invalid_model_output',
  fallback: { message: 'We could not generate a reliable insight right now. Please try again.' },
};

/** Model text is untrusted: parse it and check it against the contract. Never execute it. */
function parseInsight(raw: string): AssistantSuccess | { reason: string } {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (error) {
    return { reason: error instanceof Error ? error.name : 'unknown' };
  }
  const insight = InsightSchema.safeParse(json);
  if (!insight.success) {
    return { reason: insight.error.issues.map((issue) => issue.path.join('.')).join(',') };
  }
  return { insight: insight.data };
}

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

  // One safe line per request, written when the response is sent (401, 429 and 403 included).
  // Never headers, tokens, keys, the question, the report or the model text.
  router.use((req, res, next) => {
    const started = performance.now();
    res.on('finish', () => {
      const user = res.locals.user as SessionUser | undefined;
      logger.info('assistant request', {
        method: req.method,
        path: req.originalUrl.split('?')[0],
        userId: user?.userId,
        tenantId: user?.tenantId,
        status: res.statusCode,
        durationMs: Math.round(performance.now() - started),
      });
    });
    next();
  });

  router.post('/', requireAuth(config.authSecret), limiter, async (req, res) => {
    const body = AssistantRequestSchema.safeParse(req.body);
    if (!body.success) {
      // Paths only: never echo the input back.
      const issues = body.error.issues.map((issue) => issue.path.join('.'));
      res.status(400).json({ error: 'invalid_request', issues });
      return;
    }

    // Tenant and user come from the verified session. Check BEFORE reading any data.
    const user = sessionUser(res);
    assertCanRead(user, { kind: 'risk-report', tenantId: body.data.tenantId ?? user.tenantId });
    const report = getReport(user.tenantId);
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

    const result = parseInsight(raw);
    if ('reason' in result) {
      // Log why it failed, never the model text.
      logger.error('invalid model output', { reason: result.reason });
      res.status(502).json(INVALID_OUTPUT);
      return;
    }
    res.json(result);
  });

  return router;
}
