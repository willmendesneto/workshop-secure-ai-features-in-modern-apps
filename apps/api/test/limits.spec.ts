// Rate limit (core D test): one app, so the counter is shared across the 4 requests.
// Question size and timeout tests are extras: ./extras/limits.extra.spec.ts.
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { bearer, testConfig } from './helpers.js';

describe('input and resource limits', () => {
  it('returns 429 { error: "rate_limited" } for the 4th request from alice@acme when rateLimit.max is 3', async () => {
    const app = createApp({
      config: { ...testConfig, rateLimit: { windowMs: 60_000, max: 3 } },
    });
    const ask = () =>
      request(app)
        .post('/api/assistant')
        .set('Authorization', bearer('alice@acme'))
        .send({ question: 'Summarize performance this quarter.' });

    for (let i = 0; i < 3; i += 1) {
      expect((await ask()).status).toBe(200);
    }
    const res = await ask();

    expect(res.status).toBe(429);
    expect(res.body).toEqual({ error: 'rate_limited' });
  });
});
