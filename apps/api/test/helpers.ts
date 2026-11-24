// Shared test helpers. Tests are offline: always the mock provider, never real keys.
import type { Config } from '../src/config.js';
import { signToken } from '../src/auth/token.js';
import { findUserByEmail } from '../src/data/users.js';

export const TEST_SECRET = 'test-secret';

/** Config overrides every test starts from. Shallow-merged into the env config by createApp. */
export const testConfig = {
  authSecret: TEST_SECRET,
  provider: 'mock',
  mockScenario: 'ok',
  mockSlowMs: 2000,
  fakeProviderKey: 'wsk_demo_test0000key',
  rateLimit: { windowMs: 60_000, max: 1000 },
} satisfies Partial<Config>;

/** Signs a valid session token for one of the fake users (alice@acme, bob@globex, carol@acme). */
export function tokenFor(email: string): string {
  const user = findUserByEmail(email);
  if (!user) throw new Error(`Unknown test user: ${email}`);
  return signToken(user, TEST_SECRET);
}

/** `Authorization` header value for one of the fake users. */
export function bearer(email: string): string {
  return `Bearer ${tokenFor(email)}`;
}
