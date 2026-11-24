// Runs before every test file (vitest.config.ts and vitest.steps.config.ts): tests are offline.
// Any fetch (a real provider, a CDN, ...) fails loudly. supertest talks to the in-process app
// over node:http, so it is not affected.
const blockedFetch: typeof fetch = () => {
  throw new Error('Network access is disabled in tests');
};

globalThis.fetch = blockedFetch;
