import { Router } from 'express';
import { z } from 'zod';
import { assertCanRead } from '../auth/authorize.js';
import { requireAuth, sessionUser } from '../auth/require-auth.js';
import type { Config } from '../config.js';
import { getReport } from '../data/reports.js';

// The body may be empty. A tenantId, if sent, must match the session (otherwise 403).
const ReportRequestSchema = z.object({ tenantId: z.string().min(1).optional() });

export function dataRouter(config: Pick<Config, 'authSecret'>): Router {
  const router = Router();

  router.post('/report', requireAuth(config.authSecret), (req, res) => {
    const body = ReportRequestSchema.safeParse(req.body ?? {});
    if (!body.success) {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }

    // Tenant from the verified session. Check BEFORE reading any data.
    const user = sessionUser(res);
    assertCanRead(user, { kind: 'risk-report', tenantId: body.data.tenantId ?? user.tenantId });
    const report = getReport(user.tenantId);
    if (!report) {
      res.status(404).json({ error: 'Unknown tenant' });
      return;
    }

    res.json(report);
  });

  return router;
}
