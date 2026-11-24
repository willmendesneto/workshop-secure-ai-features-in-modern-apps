import { Router } from 'express';
import { z } from 'zod';
import { getReport } from '../data/reports.js';

const ReportRequestSchema = z.object({ tenantId: z.string().min(1) });

export function dataRouter(): Router {
  const router = Router();

  // WORKSHOP(C): no session and no assertCanRead: anyone can read any tenant's full report (risks included).
  router.post('/report', (req, res) => {
    // WORKSHOP(C): tenantId comes from the request body; derive it from the session instead.
    const body = ReportRequestSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }

    const report = getReport(body.data.tenantId);
    if (!report) {
      res.status(404).json({ error: 'Unknown tenant' });
      return;
    }

    res.json(report);
  });

  return router;
}
