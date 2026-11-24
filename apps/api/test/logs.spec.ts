// WORKSHOP(D): implement these tests. They must not depend on network or on model text.
// Use createApp({ config: testConfig }) and the helpers in ./helpers.ts. Mock provider only.
//
// Hints: the logger (src/logger.ts) writes one JSON object per line with process.stdout.write.
// Capture it per test and restore it afterwards:
//
//   const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
//   ...send the request with supertest...
//   const logs = write.mock.calls.map(([chunk]) => String(chunk)).join('');
//   afterEach(() => { vi.restoreAllMocks(); });
//
// Secrets to look for: tokenFor('alice@acme') (the bearer token), the word 'authorization',
// testConfig.fakeProviderKey, and a risk `detail` from getReport('acme') (../src/data/reports.js).
// For the field check, JSON.parse each line and find the one with msg 'assistant request'.
import { describe, it } from 'vitest';

describe('logs without secrets', () => {
  it.todo(
    'never writes the Authorization header or the bearer token (POST /api/assistant as alice@acme)',
  );
  it.todo(
    'never writes testConfig.fakeProviderKey (or any wsk_demo_ key) during a full assistant request',
  );
  it.todo(
    'never writes the full report: no risk detail from getReport("acme") after /api/data/report and /api/assistant',
  );
  it.todo(
    'writes one "assistant request" line with method, path, userId, tenantId, status and durationMs (and no body)',
  );
});
