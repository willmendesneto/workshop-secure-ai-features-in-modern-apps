// WORKSHOP(D): implement this test. It must not depend on network or on model text.
// Use createApp({ config: testConfig }) and the helpers in ./helpers.ts. Mock provider only.
// Question size and timeout tests are extras: ./extras/limits.extra.spec.ts.
//
// Hints:
// - Rate limit: create ONE app with { ...testConfig, rateLimit: { windowMs: 60_000, max: 3 } } and send
//   4 requests to it in a row (a new app resets the counter). 429 body: { error: 'rate_limited' }.
import { describe, it } from 'vitest';

describe('input and resource limits', () => {
  it.todo(
    'returns 429 { error: "rate_limited" } for the 4th request from alice@acme when rateLimit.max is 3',
  );
});
