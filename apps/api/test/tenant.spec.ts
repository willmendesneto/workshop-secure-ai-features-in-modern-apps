// WORKSHOP(D): implement these tests. They must not depend on network or on model text.
// Use createApp({ config: testConfig }) and the helpers in ./helpers.ts. Mock provider only.
import { describe, it } from 'vitest';

describe('tenant isolation and permissions', () => {
  it.todo('returns 403 when alice@acme asks POST /api/assistant with tenantId "globex"');
  it.todo('returns 403 when alice@acme requests POST /api/data/report with tenantId "globex"');
  it.todo('ignores a missing payload tenantId: alice@acme without tenantId gets 200 for acme');
  it.todo('returns 403 for carol@acme (viewer) on POST /api/data/report (risk report)');
  it.todo('returns 403 for carol@acme (viewer) on POST /api/assistant');
  it.todo('returns 200 with globex data for bob@globex (prompt built from the globex report)');
});
