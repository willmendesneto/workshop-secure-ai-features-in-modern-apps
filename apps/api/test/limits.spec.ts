// Input and resource limits: question size, rate limit per user and provider timeout.
import { MAX_QUESTION_LENGTH } from '@workshop/contracts';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { Config } from '../src/config.js';
import { bearer, testConfig } from './helpers.js';

const question = 'Summarize performance this quarter and highlight key risks.';

function ask(app: ReturnType<typeof createApp>, text = question) {
  return request(app)
    .post('/api/assistant')
    .set('Authorization', bearer('alice@acme'))
    .send({ question: text });
}

function appWith(overrides: Partial<Config> = {}) {
  return createApp({ config: { ...testConfig, ...overrides } });
}

describe('input and resource limits', () => {
  it('returns 400 { error: "invalid_request", issues: ["question"] } for a question of 2,001 characters', async () => {
    const res = await ask(appWith(), 'a'.repeat(MAX_QUESTION_LENGTH + 1));

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'invalid_request', issues: ['question'] });
  });

  it('returns 200 for a question of exactly 2,000 characters', async () => {
    const res = await ask(appWith(), 'a'.repeat(MAX_QUESTION_LENGTH));

    expect(res.status).toBe(200);
  });

  it('returns 429 { error: "rate_limited" } for the 4th request from alice@acme when rateLimit.max is 3', async () => {
    const app = appWith({ rateLimit: { windowMs: 60_000, max: 3 } });

    for (let i = 0; i < 3; i += 1) {
      expect((await ask(app)).status).toBe(200);
    }
    const res = await ask(app);

    expect(res.status).toBe(429);
    expect(res.body).toEqual({ error: 'rate_limited' });
  });

  it('returns 504 { error: "timeout" } for mockScenario "slow" with mockSlowMs 2000 and assistantTimeoutMs 50', async () => {
    const res = await ask(
      appWith({ mockScenario: 'slow', mockSlowMs: 2000, assistantTimeoutMs: 50 }),
    );

    expect(res.status).toBe(504);
    expect(res.body).toEqual({ error: 'timeout' });
  });
});
