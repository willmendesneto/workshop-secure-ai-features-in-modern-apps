# Exercise D: negative tests and logs without secrets

**Time box:** 40–52 min · **Branch:** `step-4` · **Next:** `main`

## Objective

A–C work today. Stop the assistant route from writing secrets to the logs, and write the first
negative tests that fail the build when someone removes a control.

## What is insecure right now

1. The assistant route **logs every request header and the full body**: the `Authorization`
   header (a valid bearer token) ends up in your log platform, readable by anyone with log
   access. **(D)**
2. Four core negative tests are still **`it.todo`**: nothing stops a refactor from removing the
   tenant check or the rate limit, or from bringing the unsafe log line back. **(D)**

## Files to change

```sh
grep -rn "WORKSHOP(D)" apps
```

## Steps

1. **Fix the log line** in `apps/api/src/routes/assistant.ts`. Replace the line that logs
   `headers` and `body` with one line per request, written once the response finishes (for
   example in `res.on('finish', ...)`). Log `method`, `path`, `userId`, `tenantId`, `status` and
   `durationMs`. Never tokens, headers, keys, the question, the report or model text.
2. **Write the 4 core tests.** Replace each `it.todo` with a real test. Each todo names the request,
   the config override and the expected status or body. The comment at the top of each file has
   the hints.
   - `apps/api/test/logs.spec.ts`: the bearer token and the `Authorization` header never appear in
     the logs, and the single `assistant request` line has the fields from step 1 and no body.
   - `apps/api/test/tenant.spec.ts`: alice@acme with body `tenantId: 'globex'` gets 403
     `{ error: 'forbidden' }`.
   - `apps/api/test/limits.spec.ts`: with `rateLimit.max` 3, the 4th request gets 429
     `{ error: 'rate_limited' }`.

   Assert on controls, not wording: status codes, exact error bodies and log fields. Never assert
   on the text of `insight.summary`. `auth.spec.ts` and `schema.spec.ts` each have one worked
   example to copy.

3. Run the check below.

## Hints

- Helpers in `apps/api/test/helpers.ts`: `testConfig`, `bearer('alice@acme')`, `tokenFor(email)`,
  `TEST_SECRET`.
- Config overrides per test:
  `createApp({ config: { ...testConfig, rateLimit: { windowMs: 60_000, max: 3 } } })`. Send all 4
  requests to the same app, because a new app resets the counter.
- Capture logs:

  ```ts
  const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  // ...send the request with supertest...
  const logs = write.mock.calls.map(([chunk]) => String(chunk)).join('');
  afterEach(() => {
    vi.restoreAllMocks();
  });
  ```

- Run one file: `npm test -w @workshop/api -- test/logs.spec.ts`
  (do not pass `-w` to `vitest` itself: there it means watch mode).
- A test without an `expect` fails, and `it.skip` / `it.only` fail the check.
- Optional: add redaction to `apps/api/src/logger.ts` so keys like `authorization`, `token`,
  `apiKey` and `key` are written as `"[REDACTED]"` even if someone logs them by mistake.
- Tests are offline: mock provider only, no network, no real keys.

## Done when

```sh
npm run check:step     # safe log line + no it.todo/.skip/.only in the 5 core specs + npm test green
```

> A control without a test is a control you will lose in the next refactor. A log line is a data
> export: only write what you would publish.

## Extras (after the workshop)

Not checked by `check:step`, and not part of the 12 minutes. Come back to `step-4` later and
replace the `it.todo` in `apps/api/test/extras/*.extra.spec.ts`: missing, tampered and expired
tokens, viewer permissions, the report route, invalid model output, the question size limit, the
timeout, the provider key and report content in logs. Compare with `main` when done (see
`EXTRAS.md` on `main`).

## Stuck?

```sh
git stash -u && git checkout main
```
