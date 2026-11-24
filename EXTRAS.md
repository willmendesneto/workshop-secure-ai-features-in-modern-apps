# Extras: after the workshop

The workshop core of Exercise D is 4 tests and the log fix. The rest of the negative tests are
extras: do them at home, at your own pace. They are not checked by `npm run check:step`.

## 1. Go back to the situation

```sh
git stash -u && git checkout step-4
npm ci               # only if package-lock.json changed
```

## 2. Implement the `it.todo` in `apps/api/test/extras/`

Same rules as the core: offline, mock provider, assert status codes, exact bodies, schemas,
prompts and log fields, never model wording. The comment at the top of each file has hints.

`auth.extra.spec.ts`

- 401 `{ error: "unauthorized" }` without `Authorization` on `POST /api/assistant`.
- 401 `{ error: "unauthorized" }` without `Authorization` on `POST /api/data/report`.
- 401 for a tampered token (payload `tenantId` changed to `globex`, old signature).
- 401 for an expired token (signed 9 hours ago).
- 200 and a body that passes `AssistantSuccessSchema` for a valid session.

`tenant.extra.spec.ts`

- 403 `{ error: "forbidden" }` when alice@acme asks `POST /api/data/report` for `globex`.
- 200 without `tenantId`: the prompt uses `acme`, taken from the session.
- 403 for carol@acme (viewer) on `POST /api/data/report`.
- 403 for carol@acme (viewer) on `POST /api/assistant`, and the provider is never called.
- 200 for bob@globex: the report and the prompt use `globex`, never `acme`.

`schema.extra.spec.ts`

- 502 `{ error: "invalid_model_output", fallback }` for `mockScenario: 'malformed'`.
- `injection-echo`: the HTML payload only comes back as plain JSON text, never `text/html`.
- 200 `{ insight }` that passes `InsightSchema` for `mockScenario: 'ok'`.

`limits.extra.spec.ts`

- 400 `{ error: "invalid_request", issues: ["question"] }` for 2,001 characters.
- 200 for exactly 2,000 characters.
- 504 `{ error: "timeout" }` for `mockScenario: 'slow'` with `assistantTimeoutMs: 50`.

`logs.extra.spec.ts`

- The demo provider key (`wsk_demo_`) never appears in the logs.
- No report content (a risk `detail`) and no question in the logs.
- On `main` there is also a unit test for `redact()` in `apps/api/src/logger.ts`.

Run them:

```sh
npm test -w @workshop/api -- test/extras
```

## 3. Compare with the answer key

```sh
git diff step-4 main -- apps/api/test/extras
```

## Further challenges

1. **Rate-limit policy per role and tenant.** Propose limits (for example analysts 10/min, a
   tenant-wide daily budget) and implement one with a test that proves the 429.
2. **Delimit the question in the prompt.** JSON-encode the question or wrap it in clear
   delimiters so the model sees it as data. It helps, but it does not stop prompt injection:
   output validation and escaping, and a least-privilege context (only the session tenant's data
   goes into the prompt), remain the real controls.
3. **Structured audit log.** Who asked what kind of question for which tenant, with outcome and
   reason codes, stored apart from debug logs and without the question text.
4. **Error code vocabulary.** Write down every error code the API returns (`unauthorized`,
   `forbidden`, `invalid_request`, `rate_limited`, `timeout`, `provider_error`,
   `invalid_model_output`), make the generic 404/500 bodies use the same style, put the codes in
   the contracts as a Zod enum and make the web app map each one to a message.
5. **Postgres Row-Level Security.** Add the tenant check in the database as a second layer; see
   [docs/rls.md](docs/rls.md).
