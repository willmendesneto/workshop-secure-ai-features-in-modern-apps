// Extra (after the workshop): not checked by check:step. Compare with main when done.
// Use createApp({ config: testConfig }) and the helpers in ../helpers.ts. Mock provider only.
//
// Hints: capture stdout as in ../logs.spec.ts (vi.spyOn(process.stdout, 'write')).
// Secrets to look for: testConfig.fakeProviderKey (and the 'wsk_demo_' prefix), and a risk
// `detail` from getReport('acme') (../../src/data/reports.js).
// Optional: add redaction to src/logger.ts so keys like authorization, token, apiKey and key are
// written as "[REDACTED]" even if someone logs them by mistake, and test redact() directly.
import { describe, it } from 'vitest';

describe('logs without secrets (extras)', () => {
  it.todo(
    'never writes testConfig.fakeProviderKey (or any wsk_demo_ key) during a full assistant request',
  );
  it.todo(
    'never writes the full report: no risk detail from getReport("acme") after /api/data/report and /api/assistant',
  );
});
