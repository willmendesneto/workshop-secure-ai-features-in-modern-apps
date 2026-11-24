# You're done

**Time box:** 52–60 min (closing) · **Branch:** `main` (answer key for all four exercises)

## What was fixed

- **A:** the browser no longer holds the provider key or builds the prompt; it calls
  `POST /api/assistant`, which requires a session, is rate limited per user and times out (504).
- **B:** the question is bounded on the server (1–2,000 chars, 400) and model output is parsed
  against `InsightSchema`, failing closed with a fallback (502).
- **C:** tenant and role come from the session; `assertCanRead` runs before any data is read
  (403 for another tenant or a viewer).
- **D:** the assistant log line has ids, status and duration only, never tokens or content, and
  the 4 core negative tests guard it (no token in logs, the safe log line, 403 for another tenant,
  429 over the rate limit). The other negative tests are the extras, solved on `main` in
  `apps/api/test/extras/` (no `it.todo` left anywhere, `fetch` blocked in tests).
- **Production hardening (main only):** `AUTH_SECRET` guard in production, `/fake-provider` only
  with the mock outside production, baseline security headers.

## Where to look

- [CHECKLIST.md](CHECKLIST.md): the production checklist for AI features (9 items).
- [docs/before-after.md](docs/before-after.md): `step-1` → `main`, control by control, with code.
- [docs/trust-boundaries.md](docs/trust-boundaries.md): the four boundaries and their controls.
- [docs/rls.md](docs/rls.md): Row-Level Security as an extra tenant layer in the database.
- [EXTRAS.md](EXTRAS.md): the extra negative tests to do on `step-4` and further challenges.

## Check it

```sh
npm run check:step     # step 5: runs the checks of every exercise, A to D, and prints a summary
npm run validate       # what CI runs
```

## After the workshop

Go back to `step-4`, implement the `it.todo` in `apps/api/test/extras/` and compare with `main`.
Further challenges (rate-limit policy, prompt delimiting, audit log, error codes, RLS) are in
[EXTRAS.md](EXTRAS.md).

> A control without a test is a control you will lose in the next refactor. A log line is a data
> export: only write what you would publish.
