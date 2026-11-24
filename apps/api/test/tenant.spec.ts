// WORKSHOP(D): implement this test. It must not depend on network or on model text.
// Use createApp({ config: testConfig }) and the helpers in ./helpers.ts. Mock provider only.
// More tenant and permission tests are extras: ./extras/tenant.extra.spec.ts.
//
// Hints:
// - Users: alice@acme (analyst), bob@globex (analyst), carol@acme (viewer). Use bearer(email).
// - 403 bodies are exactly { error: 'forbidden' } (thrown by assertCanRead, mapped in app.ts).
import { describe, it } from 'vitest';

describe('tenant isolation and permissions', () => {
  it.todo(
    'returns 403 { error: "forbidden" } when alice@acme sends { question, tenantId: "globex" } to POST /api/assistant',
  );
});
