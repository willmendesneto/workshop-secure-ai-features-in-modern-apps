// WORKSHOP(D): implement these tests. They must not depend on network or on model text.
// Use createApp({ config: testConfig }) and the helpers in ./helpers.ts. Mock provider only.
//
// Hints:
// - Build questions with 'a'.repeat(n). MAX_QUESTION_LENGTH (2000) is exported by '@workshop/contracts'.
// - 400 bodies are { error: 'invalid_request', issues: ['question'] } (paths only, no echo of the input).
// - Rate limit: create ONE app with { ...testConfig, rateLimit: { windowMs: 60_000, max: 3 } } and send
//   4 requests to it in a row (a new app resets the counter). 429 body: { error: 'rate_limited' }.
// - Timeout: { ...testConfig, mockScenario: 'slow', mockSlowMs: 2000, assistantTimeoutMs: 50 } answers
//   in ~50 ms, so no fake timers are needed.
import { describe, it } from 'vitest';

describe('input and resource limits', () => {
  it.todo(
    'returns 400 { error: "invalid_request", issues: ["question"] } for a question of 2,001 characters',
  );
  it.todo('returns 200 for a question of exactly 2,000 characters');
  it.todo(
    'returns 429 { error: "rate_limited" } for the 4th request from alice@acme when rateLimit.max is 3',
  );
  it.todo(
    'returns 504 { error: "timeout" } for mockScenario "slow" with mockSlowMs 2000 and assistantTimeoutMs 50',
  );
});
