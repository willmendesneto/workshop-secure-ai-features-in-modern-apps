// WORKSHOP(D): implement these tests. They must not depend on network or on model text.
// Use createApp({ config: testConfig }) and the helpers in ./helpers.ts. Mock provider only.
import { describe, it } from 'vitest';

describe('input and resource limits', () => {
  it.todo('returns 400 for a question of 2,001 characters');
  it.todo('returns 200 for a question of exactly 2,000 characters');
  it.todo('returns 429 for the 4th request when config.rateLimit.max is 3');
  it.todo(
    'returns 504 { error: "timeout" } for mockScenario "slow" with mockSlowMs 2000 and assistantTimeoutMs 50',
  );
});
