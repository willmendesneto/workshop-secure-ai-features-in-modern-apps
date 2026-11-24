// Happy-path smoke tests. They only check shapes, never model wording.
import { AssistantSuccessSchema, CompanyReportSchema } from '@workshop/contracts';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { bearer, testConfig } from './helpers.js';

describe('POST /api/data/report', () => {
  it('returns the acme report with 4 quarters', async () => {
    const res = await request(createApp({ config: testConfig }))
      .post('/api/data/report')
      .set('Authorization', bearer('alice@acme'))
      .send({ tenantId: 'acme' });

    expect(res.status).toBe(200);
    const report = CompanyReportSchema.parse(res.body);
    expect(report.tenantId).toBe('acme');
    expect(report.quarters).toHaveLength(4);
  });
});

describe('POST /api/assistant', () => {
  it('returns 200 { insight } that matches AssistantSuccessSchema (ok scenario)', async () => {
    const res = await request(createApp({ config: testConfig }))
      .post('/api/assistant')
      .set('Authorization', bearer('alice@acme'))
      .send({ question: 'Summarize performance and highlight key risks.', tenantId: 'acme' });

    expect(res.status).toBe(200);
    expect(AssistantSuccessSchema.safeParse(res.body).success).toBe(true);
  });
});
