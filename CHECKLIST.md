# Production checklist for AI features

> Draft: replace with the 9 items from the Workshop Guide.

Nine rules to check before an AI feature ships. Each one is implemented and tested on `main`.

- [ ] **1. Provider keys live only on the server.** Read them from the environment, never ship
      them in the frontend bundle, and fail the build if one leaks.
  - Why: anything in the bundle or the Network tab is public; a leaked key spends your money.
  - In this repo: `apps/api/src/config.ts` (only env reader), `scripts/check-bundle.mjs`
    (`npm run check:bundle`).

- [ ] **2. Authenticate every AI endpoint.** No anonymous calls to a route that spends provider
      money or reads company data.
  - Why: an open endpoint is a free LLM proxy and a data leak.
  - In this repo: `apps/api/src/auth/require-auth.ts` (401 `unauthorized`).

- [ ] **3. Authorize per tenant and role from the session, before reading data.** A `tenantId` or
      role in the request body is a claim, not a fact.
  - Why: one changed field in the body would otherwise read another customer's data.
  - In this repo: `apps/api/src/auth/authorize.ts` (`assertCanRead`, 403 `forbidden`). Extra
    layer in the database: Row-Level Security, see `docs/rls.md`.

- [ ] **4. Bound the input on the server.** Size and format are checked by the API; the browser
      counter is only UX.
  - Why: oversize prompts cost money, hit context limits and hide injections.
  - In this repo: `packages/contracts/src/index.ts` (`AskRequestSchema`, 1–2,000 chars, 400),
    `apps/api/src/app.ts` (`express.json({ limit: '100kb' })`).

- [ ] **5. Validate model output against a schema and fail closed.** Parse it, check it against
      the contract and answer with a fallback when it does not match.
  - Why: models return malformed or partial JSON; the UI must never break on it.
  - In this repo: `apps/api/src/routes/assistant.ts` (`parseInsight` + `InsightSchema`, 502
    `invalid_model_output` with a fallback).

- [ ] **6. Treat model output as untrusted data.** Never execute it, never render it as HTML,
      never build SQL or tool calls from it without a server-side permission check.
  - Why: a valid schema says nothing about intent; injected output can carry HTML or SQL.
  - In this repo: `apps/web/src/app/chat/chat.html` (interpolation `{{ }}` only),
    `eslint.config.mjs` (no `innerHTML`, no `eval`).

- [ ] **7. Rate limit per user and time-box provider calls.** Limit by session user, not IP, and
      abort slow provider calls.
  - Why: one user or one slow provider must not exhaust your budget or your server.
  - In this repo: `apps/api/src/routes/assistant.ts` (`express-rate-limit` keyed by `userId`, 429;
    `AbortController` with `assistantTimeoutMs`, 504).

- [ ] **8. Log without secrets or unnecessary sensitive data.** One line per request with ids,
      status and duration; never tokens, headers, keys, prompts, reports or model text.
  - Why: a log line is a data export, readable by everyone with log access.
  - In this repo: `apps/api/src/routes/assistant.ts` (`assistant request` line on `finish`),
    `apps/api/src/logger.ts` (`redact`, defense in depth).

- [ ] **9. Test every control offline, with negative cases.** Assert status codes, schemas and
      prompts, never model wording; block the network in tests.
  - Why: a control without a test disappears in the next refactor.
  - In this repo: `apps/api/test/{auth,tenant,schema,limits,logs}.spec.ts`,
    `apps/api/test/setup.ts` (fetch blocked).
