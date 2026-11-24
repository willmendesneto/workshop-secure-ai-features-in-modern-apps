// Extra (after the workshop): not checked by check:step. Compare with main when done.
// Use createApp({ config: testConfig }) and the helpers in ../helpers.ts. Mock provider only.
//
// Hints:
// - Users: alice@acme (analyst), bob@globex (analyst), carol@acme (viewer). Use bearer(email).
// - 403 bodies are exactly { error: 'forbidden' } (thrown by assertCanRead, mapped in app.ts).
// - Report route: POST /api/data/report with a JSON body ({} or { tenantId }); parse the 200 body
//   with CompanyReportSchema and assert on report.tenantId.
// - To see the prompt, pass a recording provider: createApp({ config: testConfig, provider }) where
//   provider.generate(input) pushes input and resolves a fixed valid Insight JSON string
//   (see ../steps/exercise-c.check.ts). Assert the prompt contains '"tenantId":"globex"' and not '"acme"'.
import { describe, it } from 'vitest';

describe('tenant isolation and permissions (extras)', () => {
  it.todo(
    'returns 403 { error: "forbidden" } when alice@acme sends { tenantId: "globex" } to POST /api/data/report',
  );
  it.todo(
    'returns 200 when alice@acme sends { question } without tenantId (acme from the session)',
  );
  it.todo(
    'returns 403 { error: "forbidden" } for carol@acme (viewer) on POST /api/data/report with {}',
  );
  it.todo(
    'returns 403 { error: "forbidden" } for carol@acme (viewer) on POST /api/assistant with { question }',
  );
  it.todo(
    'returns 200 for bob@globex: POST /api/data/report {} has tenantId "globex" and the assistant prompt uses the globex report',
  );
});
