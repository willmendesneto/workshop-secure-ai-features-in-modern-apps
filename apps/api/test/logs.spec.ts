// WORKSHOP(D): implement these tests. They must not depend on network or on model text.
// Use createApp({ config: testConfig }) and the helpers in ./helpers.ts. Mock provider only.
// More log tests (provider key, report content) are extras: ./extras/logs.extra.spec.ts.
//
// Hints: the logger (src/logger.ts) writes one JSON object per line with process.stdout.write.
// Capture it per test and restore it afterwards:
//
//   const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
//   ...send the request with supertest...
//   const logs = write.mock.calls.map(([chunk]) => String(chunk)).join('');
//   afterEach(() => { vi.restoreAllMocks(); });
//
// Secrets to look for: tokenFor('alice@acme') (the bearer token) and the word 'authorization'.
// For the field check, JSON.parse each line and find the one with msg 'assistant request'.
import { describe, it } from 'vitest';

describe('logs without secrets', () => {
  it.todo(
    'never writes the Authorization header or the bearer token (POST /api/assistant as alice@acme)',
  );
  it.todo(
    'writes one "assistant request" line with method, path, userId, tenantId, status and durationMs (and no body)',
  );
});
