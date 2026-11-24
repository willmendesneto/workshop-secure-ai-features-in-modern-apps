// Tenant isolation (core D test): the tenant comes from the session, a body tenantId is only
// compared. More tenant and permission tests are extras: ./extras/tenant.extra.spec.ts.
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { bearer, testConfig } from './helpers.js';

describe('tenant isolation and permissions', () => {
  it('returns 403 { error: "forbidden" } when alice@acme sends { question, tenantId: "globex" } to POST /api/assistant', async () => {
    const res = await request(createApp({ config: testConfig }))
      .post('/api/assistant')
      .set('Authorization', bearer('alice@acme'))
      .send({ question: 'Summarize performance this quarter.', tenantId: 'globex' });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'forbidden' });
  });
});
