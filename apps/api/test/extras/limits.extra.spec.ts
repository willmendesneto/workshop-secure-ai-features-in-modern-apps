// Extra (after the workshop): answer key. On step-4 these tests are todos.
// Question size and provider timeout. Mock provider, no fake timers needed.
import { MAX_QUESTION_LENGTH } from '@workshop/contracts';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import type { Config } from '../../src/config.js';
import { bearer, testConfig } from '../helpers.js';

const question = 'Summarize performance this quarter and highlight key risks.';

function ask(overrides: Partial<Config> = {}, text = question) {
  return request(createApp({ config: { ...testConfig, ...overrides } }))
    .post('/api/assistant')
    .set('Authorization', bearer('alice@acme'))
    .send({ question: text });
}

describe('input and resource limits (extras)', () => {
  it('returns 400 { error: "invalid_request", issues: ["question"] } for a question of 2,001 characters', async () => {
    const res = await ask({}, 'a'.repeat(MAX_QUESTION_LENGTH + 1));

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'invalid_request', issues: ['question'] });
  });

  it('returns 200 for a question of exactly 2,000 characters', async () => {
    const res = await ask({}, 'a'.repeat(MAX_QUESTION_LENGTH));

    expect(res.status).toBe(200);
  });

  it('returns 504 { error: "timeout" } for mockScenario "slow" with mockSlowMs 2000 and assistantTimeoutMs 50', async () => {
    const res = await ask({ mockScenario: 'slow', mockSlowMs: 2000, assistantTimeoutMs: 50 });

    expect(res.status).toBe(504);
    expect(res.body).toEqual({ error: 'timeout' });
  });
});
