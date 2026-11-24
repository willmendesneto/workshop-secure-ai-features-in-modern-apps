# You're done

**Time box:** 52–60 min (closing) · **Branch:** `main` (answer key for all four exercises)

## What was fixed

- **A:** the browser no longer holds the provider key or builds the prompt; it calls
  `POST /api/assistant`, which requires a session, is rate limited per user and times out (504).
- **B:** the question is bounded on the server (1–2,000 chars, 400) and model output is parsed
  against `InsightSchema`, failing closed with a fallback (502).
- **C:** tenant and role come from the session; `assertCanRead` runs before any data is read
  (403 for another tenant or a viewer).
- **D:** every control has an offline negative test (no `it.todo` left, `fetch` blocked in tests)
  and the assistant log line has ids, status and duration only, never tokens or content.

## Where to look

- [CHECKLIST.md](CHECKLIST.md): the production checklist for AI features (9 items).
- [docs/before-after.md](docs/before-after.md): `step-1` → `main`, control by control, with code.
- [docs/trust-boundaries.md](docs/trust-boundaries.md): the four boundaries and their controls.
- [docs/rls.md](docs/rls.md): Row-Level Security as an extra tenant layer in the database.

## Check it

```sh
npm run check:step     # step 5: runs the checks of every exercise, A to D, and prints a summary
npm run validate       # what CI runs
```

## Finished early? Extension ideas

1. **Rate-limit policy per role and tenant:** propose limits (for example analysts 10/min, a
   tenant-wide budget per day) and implement one with a test that proves the 429.
2. **More negative tests:** a token signed with another secret, a body with extra fields, a
   provider that throws, `injection-echo` on the web side (the payload renders as text).
3. **Prompt-injection classifier:** add a cheap check on the question as an extra signal (log the
   verdict, maybe ask for confirmation). It is a signal, not a control: keep every check above.
4. **Structured audit log:** who asked what kind of question for which tenant, with outcome and
   reason codes, stored apart from debug logs and without the question text.

> A control without a test is a control you will lose in the next refactor. A log line is a data
> export: only write what you would publish.
