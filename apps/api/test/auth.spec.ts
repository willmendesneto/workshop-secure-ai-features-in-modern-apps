// WORKSHOP(D): implement these tests. They must not depend on network or on model text.
// Use createApp({ config: testConfig }) and the helpers in ./helpers.ts. Mock provider only.
//
// Hints:
// - request(createApp({ config: testConfig })).post('/api/assistant').set('Authorization', bearer('alice@acme'))
// - Tampered token: split tokenFor('alice@acme') on '.', decode the payload (base64url JSON), set
//   tenantId: 'globex', re-encode it and keep the old signature (see login.spec.ts "tampered token").
// - Expired token: signToken(user, TEST_SECRET, Date.now() - 9 * 60 * 60 * 1000) from ../src/auth/token.js
//   (user = findUserByEmail('alice@acme') from ../src/data/users.js).
// - Assert status and body only: 401 bodies are exactly { error: 'unauthorized' }.
import { describe, it } from 'vitest';

describe('POST /api/assistant authentication', () => {
  it.todo('returns 401 { error: "unauthorized" } when the Authorization header is missing');
  it.todo(
    'returns 401 { error: "unauthorized" } for a tampered token (payload tenantId "globex", old signature)',
  );
  it.todo('returns 401 { error: "unauthorized" } for an expired token (signed 9 hours ago)');
  it.todo(
    'returns 200 and a body that passes AssistantSuccessSchema for bearer("alice@acme") and { question }',
  );
});
