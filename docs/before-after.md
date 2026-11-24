# Before and after: `step-1` → `main`

Summary of what the four exercises changed, for the closing slide. The full diff:

```sh
git diff step-1 main --stat              # every file that changed
git diff step-1 main -- apps/api/src     # the API controls
git diff step-1 main -- apps/web/src     # the browser no longer talks to the provider
```

## Controls

| Control               | Before on `step-1`                                                  | After on `main`                                                                                                                                                    | File                                                                                        |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Provider key (A)      | In `environment.ts`, shipped in the bundle, sent in the URL         | Server env only (`config.ts`); `check:bundle` fails on a key-like string                                                                                           | `apps/api/src/config.ts`, `scripts/check-bundle.mjs`                                        |
| Prompt and data (A)   | Built in the browser from the full report                           | Built on the server (`buildPrompt`); the browser sends `{ question }`                                                                                              | `apps/api/src/assistant/prompt.ts`, `apps/web/src/app/assistant/assistant.service.ts`       |
| Authentication (A, C) | None on `/api/assistant` or `/api/data/report`                      | (A) `/api/assistant`; (C) `/api/data/report`: `requireAuth` → 401 `unauthorized`                                                                                   | `apps/api/src/auth/require-auth.ts`                                                         |
| Rate limit (A)        | None                                                                | Per session user → 429 `rate_limited`                                                                                                                              | `apps/api/src/routes/assistant.ts`                                                          |
| Timeout (A)           | Provider call waits forever                                         | `AbortController` after `assistantTimeoutMs` → 504 `timeout`                                                                                                       | `apps/api/src/routes/assistant.ts`                                                          |
| Input bounds (B)      | `question: z.string().min(1)`, no maximum                           | `AskRequestSchema`: trimmed, 1–2,000 chars → 400 `invalid_request` (paths only)                                                                                    | `packages/contracts/src/index.ts`                                                           |
| Model output (B)      | `res.json({ raw })`, the browser does `JSON.parse(text) as Insight` | `JSON.parse` + `InsightSchema.safeParse` → 502 `invalid_model_output` + fallback                                                                                   | `apps/api/src/routes/assistant.ts`                                                          |
| Tenant and role (C)   | `tenantId` from the body, no permission check                       | Tenant from the session, `assertCanRead` before `getReport` → 403 `forbidden`                                                                                      | `apps/api/src/auth/authorize.ts`, `apps/api/src/routes/data.ts`                             |
| Logs (D)              | Every header (bearer token included) and the full body              | One line on `finish`: method, path, userId, tenantId, status, durationMs; `redact`                                                                                 | `apps/api/src/routes/assistant.ts`, `apps/api/src/logger.ts`                                |
| Negative tests (D)    | `it.todo`                                                           | Core: 4 offline tests (no token in logs, safe log line, 403, 429) + 2 worked examples; extras: 19 more (401, 403, 400, 502, 504, logs, redaction); `fetch` blocked | `apps/api/test/*.spec.ts`, `apps/api/test/extras/*.extra.spec.ts`, `apps/api/test/setup.ts` |

## Code excerpts

### 1. The browser called the provider with the key (A)

Before (`step-1:apps/web/src/app/assistant/assistant.service.ts`):

```ts
const url = `${environment.providerBaseUrl}/v1beta/models/${environment.providerModel}:generateContent?key=${environment.providerApiKey}`;
const response = await firstValueFrom(this.http.post<GeminiResponse>(url, body));
```

After (`main:apps/web/src/app/assistant/assistant.service.ts`):

```ts
this.http.post<AssistantSuccess>(
  '/api/assistant',
  // No tenantId: the API takes the tenant from the verified session.
  { question },
  { headers: { Authorization: `Bearer ${session.token}` } },
),
```

### 2. An open route with no limits (A)

Before (`step-1:apps/api/src/routes/assistant.ts`):

```ts
router.post('/', async (req, res) => {
  // ...
  raw = await provider.generate(buildPrompt(report, body.data.question));
```

After (`main:apps/api/src/routes/assistant.ts`):

```ts
router.post('/', requireAuth(config.authSecret), limiter, async (req, res) => {
  // ...
  const timer = setTimeout(() => {
    controller.abort();
  }, config.assistantTimeoutMs);
  raw = await provider.generate(buildPrompt(report, body.data.question), {
    signal: controller.signal,
  });
```

### 3. Raw model output went to the client (B)

Before:

```ts
res.json({ raw });
```

After:

```ts
const result = parseInsight(raw); // JSON.parse + InsightSchema.safeParse
if ('reason' in result) {
  // Log why it failed, never the model text.
  logger.error('invalid model output', { reason: result.reason });
  res.status(502).json(INVALID_OUTPUT); // { error: 'invalid_model_output', fallback: { message } }
  return;
}
res.json(result);
```

### 4. The tenant came from the body (C)

Before (`step-1:apps/api/src/routes/data.ts`):

```ts
const ReportRequestSchema = z.object({ tenantId: z.string().min(1) });
// ...
const report = getReport(body.data.tenantId);
```

After (`main:apps/api/src/routes/data.ts`):

```ts
// Tenant from the verified session. Check BEFORE reading any data.
const user = sessionUser(res);
assertCanRead(user, { kind: 'risk-report', tenantId: body.data.tenantId ?? user.tenantId });
const report = getReport(user.tenantId);
```

### 5. Logs carried the bearer token (D)

Before:

```ts
logger.info('assistant request', { headers: req.headers, body: req.body as unknown });
```

After:

```ts
res.on('finish', () => {
  const user = res.locals.user as SessionUser | undefined;
  logger.info('assistant request', {
    method: req.method,
    path: req.originalUrl.split('?')[0],
    userId: user?.userId,
    tenantId: user?.tenantId,
    status: res.statusCode,
    durationMs: Math.round(performance.now() - started),
  });
});
```

### 6. Controls without tests (D)

Before (`step-1:apps/api/test/limits.spec.ts`):

```ts
it.todo('returns 429 for the 4th request when config.rateLimit.max is 3');
```

After (`main:apps/api/test/limits.spec.ts`, one of the 4 core tests; the other negative tests are
in `apps/api/test/extras/`, see [EXTRAS.md](../EXTRAS.md)):

```ts
for (let i = 0; i < 3; i += 1) {
  expect((await ask()).status).toBe(200);
}
const res = await ask();

expect(res.status).toBe(429);
expect(res.body).toEqual({ error: 'rate_limited' });
```
