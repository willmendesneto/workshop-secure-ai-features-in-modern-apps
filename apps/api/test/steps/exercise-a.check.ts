// "Done when" contract for Exercise A. Run with `npm run check:step` (not part of `npm test`).
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { bearer, testConfig } from '../helpers.js';

const question = 'Summarize Acme performance this quarter and highlight key risks.';

describe('Exercise A: provider call behind an authenticated, limited endpoint', () => {
  it('POST /api/assistant without a token returns 401', async () => {
    const res = await request(createApp({ config: testConfig }))
      .post('/api/assistant')
      .send({ question, tenantId: 'acme' });

    expect(res.status).toBe(401);
  });

  it('POST /api/assistant with a valid alice@acme token returns 200', async () => {
    const res = await request(createApp({ config: testConfig }))
      .post('/api/assistant')
      .set('Authorization', bearer('alice@acme'))
      .send({ question, tenantId: 'acme' });

    expect(res.status).toBe(200);
  });

  it('returns 429 once a user goes above config.rateLimit.max (3)', async () => {
    const app = createApp({ config: { ...testConfig, rateLimit: { windowMs: 60_000, max: 3 } } });
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const res = await request(app)
        .post('/api/assistant')
        .set('Authorization', bearer('alice@acme'))
        .send({ question, tenantId: 'acme' });
      statuses.push(res.status);
    }

    expect(statuses).toEqual([200, 200, 200, 429]);
  });

  it('returns 504 { error: "timeout" } when the provider is slower than assistantTimeoutMs', async () => {
    const app = createApp({
      config: { ...testConfig, mockScenario: 'slow', mockSlowMs: 2000, assistantTimeoutMs: 50 },
    });
    const res = await request(app)
      .post('/api/assistant')
      .set('Authorization', bearer('alice@acme'))
      .send({ question, tenantId: 'acme' });

    expect(res.status).toBe(504);
    expect(res.body).toEqual({ error: 'timeout' });
  }, 10_000);
});
