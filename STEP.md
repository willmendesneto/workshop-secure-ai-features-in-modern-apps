# Exercise A: move the provider call to the backend

**Time box:** 05–15 min · **Branch:** `step-1` · **Next:** `step-2`

## Objective

The assistant works in the demo. Make it safe to ship: the browser must never hold the provider
key, and the API endpoint that spends provider money must be authenticated, limited and time-boxed.

## What is insecure right now

1. The Angular app calls the LLM provider **directly from the browser** with the key from
   `apps/web/src/environments/environment.ts`. It is in the bundle and in the Network tab. **(A)**
2. `POST /api/assistant` works, but has **no auth, no rate limit and no timeout**. **(A)**
3. `POST /api/data/report` and `POST /api/assistant` take **`tenantId` from the request body**. **(C)**
4. The model response goes **raw to the UI** without schema validation. **(B)**
5. The assistant route **logs all request headers and the body** (Authorization included). **(D)**

Today you fix 1 and 2. The others are the next exercises.

## Files to change

```sh
grep -rn "WORKSHOP(A)" apps
```

## Steps

1. **Web:** in `AssistantService`, replace steps 1–4 with a single
   `POST /api/assistant { question, tenantId }` that sends `Authorization: Bearer <token>`
   (the token is in `SessionService`). For now show the `raw` text parsed as JSON, as today.
2. **Web:** delete `providerApiKey` (and the browser prompt in `app/assistant/prompt.ts`).
   The API already builds the prompt in `apps/api/src/assistant/prompt.ts`.
3. **API:** wire the existing `requireAuth(config.authSecret)`
   (`apps/api/src/auth/require-auth.ts`) into the assistant route. It answers `401` without a
   valid `Authorization: Bearer <token>`; read the user with `sessionUser(res)`.
4. **API:** add a rate limiter with `express-rate-limit` using `config.rateLimit`
   (`windowMs`, `max`), keyed by `sessionUser(res).userId`. Above the limit it must answer `429`.
5. **API:** time-box the provider call: create an `AbortController`, abort after
   `config.assistantTimeoutMs`, pass `{ signal }` to `provider.generate`, and answer
   `504 { error: 'timeout' }` when it aborts. Clear the timer when done.
6. Run the checks below.

## Hints

- `express-rate-limit` is already installed in `apps/api`.
- `requireAuth` is already written (it calls `verifyToken` from `apps/api/src/auth/token.ts`).
  `assistantRouter` needs `config` to use it: pass it from `createApp`.
- Put `requireAuth` before the limiter on the route, so `sessionUser(res)` is set in `keyGenerator`.
- `config.assistantTimeoutMs` and `config.rateLimit` already exist in `apps/api/src/config.ts`.
- Create the limiter inside `createApp` (per app instance), so each test gets a fresh one.
- An aborted provider call rejects with an error whose `name` is `'AbortError'`.
- `createApp({ config })` accepts overrides, so tests can set `rateLimit.max: 3`.

## Done when

```sh
npm run check:step     # 401 without token, 200 with token, 429 above the limit, 504 on timeout
```

`check:step` also runs the bundle scan (`check:bundle`): no key-like string in the web bundle.

> In real life, a key that ever shipped to a browser is leaked: **rotate it**, then move it.

## Stuck?

Your work, including new files, goes to the stash:

```sh
git stash -u && git checkout step-2
```
