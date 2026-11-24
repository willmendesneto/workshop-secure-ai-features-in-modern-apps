// Extra (after the workshop): not checked by check:step. Compare with main when done.
// Use createApp({ config: testConfig }) and the helpers in ../helpers.ts. Mock provider only.
//
// Hints:
// - Build questions with 'a'.repeat(n). MAX_QUESTION_LENGTH (2000) is exported by '@workshop/contracts'.
// - 400 bodies are { error: 'invalid_request', issues: ['question'] } (paths only, no echo of the input).
// - Timeout: { ...testConfig, mockScenario: 'slow', mockSlowMs: 2000, assistantTimeoutMs: 50 } answers
//   in ~50 ms, so no fake timers are needed.
import { describe, it } from 'vitest';

describe('input and resource limits (extras)', () => {
  it.todo(
    'returns 400 { error: "invalid_request", issues: ["question"] } for a question of 2,001 characters',
  );
  it.todo('returns 200 for a question of exactly 2,000 characters');
  it.todo(
    'returns 504 { error: "timeout" } for mockScenario "slow" with mockSlowMs 2000 and assistantTimeoutMs 50',
  );
});
