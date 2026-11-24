// WORKSHOP(D): implement these tests. They must not depend on network or on model text.
// Use createApp({ config: testConfig }) and the helpers in ./helpers.ts. Mock provider only.
// Capture logs with vi.spyOn(process.stdout, 'write') and assert on the captured text.
import { describe, it } from 'vitest';

describe('logs without secrets', () => {
  it.todo('never writes the Authorization header or the bearer token to the logs');
  it.todo('never writes the provider key (config.fakeProviderKey / real API keys) to the logs');
  it.todo('never writes the full data report (e.g. risk details) to the logs');
});
