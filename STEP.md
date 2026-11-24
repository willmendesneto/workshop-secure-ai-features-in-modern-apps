# Exercise C: tenant and permissions from the session

**Time box:** 25–40 min · **Branch:** `step-3` · **Next:** `step-4`

## Objective

Input and output are validated. Now stop letting the browser decide **whose** data the assistant
reads. The tenant and the user come from the verified session, and an explicit permission check
runs **before** any data is loaded.

## What is insecure right now

1. `POST /api/assistant` and `POST /api/data/report` take **`tenantId` from the request body**:
   Alice (Acme) can read Globex by changing one field. **(C)**
2. `POST /api/data/report` has **no auth at all**, and nobody checks the role: Carol (viewer) can
   read risk reports and ask the assistant about them. **(C)**
3. The web sends `tenantId` in the body, as if the browser were allowed to choose. **(C)**
4. The assistant route **logs all request headers and the body** (Authorization header included),
   and the negative tests are still `it.todo`. **(D)**

Today you fix 1 to 3. The last one is the next exercise.

## Files to change

```sh
grep -rn "WORKSHOP(C)" apps packages
```

## Steps

1. **Session:** in both routes, take `tenantId` and `userId` from `sessionUser(res)` (set by
   `requireAuth`), never from the body.
2. **Authorization:** add `apps/api/src/auth/authorize.ts` with
   `assertCanRead(user, resource)`, for example with `resource = { kind: 'risk-report', tenantId }`.
   Deny when `resource.tenantId !== user.tenantId` or when `user.role === 'viewer'`. Answer `403`
   when it denies.
3. **Order matters:** call `assertCanRead` **before** `getReport(...)` and before building the
   prompt. A check after the read has already leaked the data into memory, logs or the prompt.
4. **Payload tenant:** if the body still carries a `tenantId` that differs from the session,
   answer `403`. A missing or matching `tenantId` is fine (`200`).
5. **Data route:** protect `POST /api/data/report` with `requireAuth(config.authSecret)` and the
   same `assertCanRead` (see how `app.ts` wires `assistantRouter`).
6. **Web:** stop sending `tenantId` from `AssistantService`; the API knows the tenant.
7. Replay `requests/tenant-tamper.http`, then run the checks below.

## Hints

- `sessionUser(res)` is typed `SessionUser` (`userId`, `email`, `tenantId`, `role`).
- Throw a small `ForbiddenError` from `assertCanRead` and map it to `403 { error: 'forbidden' }`,
  or return a boolean: either is fine as long as the check runs first.
- `AskRequestSchema.extend({ tenantId: z.string().min(1).optional() })` keeps the body schema
  while you compare the payload tenant to the session.
- Users: `alice@acme` (analyst), `bob@globex` (analyst), `carol@acme` (viewer).
- Optional extra layer: Row-Level Security in the database, see `docs/rls.md` on the next branch.

## Done when

```sh
npm run check:step     # tamper -> 403, Carol -> 403, Bob gets Globex data
```

> The browser can send any field. A permission is a server decision made from the session.

## Stuck?

```sh
git stash -u && git checkout step-4
```
