// WORKSHOP(D): implement these tests. They must not depend on network or on model text.
// Use createApp({ config: testConfig }) and the helpers in ./helpers.ts. Mock provider only.
import { describe, it } from 'vitest';

describe('POST /api/assistant authentication', () => {
  it.todo('returns 401 when the Authorization header is missing');
  it.todo('returns 401 for a tampered token (payload tenantId changed, signature kept)');
  it.todo('returns 401 for an expired token (signed 9 hours ago)');
  it.todo('returns 200 for a valid alice@acme token and { question, tenantId: "acme" }');
});
