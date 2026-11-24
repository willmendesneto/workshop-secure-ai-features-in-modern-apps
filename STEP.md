# Exercise D: negative tests and logs without secrets

**Time box:** 40–52 min · **Branch:** `step-4` · **Next:** `main`

## Objective

A–C work today. Make sure they keep working: write the negative tests that fail the build when
someone removes a control, and stop the assistant route from writing secrets to the logs.

## What is insecure right now

1. The assistant route **logs every request header and the full body**: the `Authorization`
   header (a valid bearer token) ends up in your log platform, readable by anyone with log
   access. **(D)**
2. The negative tests are still **`it.todo`**: nothing stops a refactor from removing `requireAuth`,
   the schema checks, `assertCanRead`, the rate limit or the timeout. **(D)**

## Files to change

```sh
grep -rn "WORKSHOP(D)" apps
```

## Steps

1. **Tests:** replace every `it.todo` in `apps/api/test/{auth,tenant,schema,limits,logs}.spec.ts`
   with a real test. Each todo names the request, the config override and the expected status or
   body; the comment at the top of each file has the hints. Cover: authenticated user, no
   permission (viewer), other tenant, invalid model output, oversize input, timeout, rate limit,
   and logs without secrets.
2. **Assert controls, not wording:** status codes, contract schemas (`AssistantSuccessSchema`,
   `CompanyReportSchema`, ...) and prompts. Never the text of `insight.summary`.
3. **Fix the log line** in `apps/api/src/routes/assistant.ts`: log `method`, `path`, `userId`,
   `tenantId`, `status` and `durationMs` once the response finishes (for example in
   `res.on('finish', ...)`). Never tokens, headers, keys, the question, the report or model text.
4. **Optional:** add redaction to `apps/api/src/logger.ts` so keys like `authorization`, `token`,
   `apiKey` and `key` are written as `"[redacted]"` even if someone logs them by mistake.
5. Run the checks below.

## Hints

- Helpers in `apps/api/test/helpers.ts`: `testConfig`, `bearer('alice@acme')`, `tokenFor(email)`,
  `TEST_SECRET`.
- Config overrides per test: `createApp({ config: { ...testConfig, rateLimit: { windowMs: 60_000, max: 3 } } })`,
  `mockScenario: 'malformed' | 'injection-echo' | 'slow'`, `mockSlowMs: 2000` with
  `assistantTimeoutMs: 50`.
- Capture logs: `const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)`,
  then `write.mock.calls.map(([chunk]) => String(chunk)).join('')`; `vi.restoreAllMocks()` in
  `afterEach`.
- Run one file: `npm test -w @workshop/api -- test/limits.spec.ts`
  (do not pass `-w` to `vitest` itself: there it means watch mode).
- Tests are offline: mock provider only, no network, no real keys.

## Done when

```sh
npm run check:step     # no it.todo left in the 5 specs + npm test green (offline)
```

> A control without a test is a control you will lose in the next refactor. A log line is a data
> export: only write what you would publish.

## Stuck?

```sh
git stash && git checkout main
```
