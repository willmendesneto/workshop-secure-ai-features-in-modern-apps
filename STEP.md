# Exercise B: validate input and model output

**Time box:** 15–25 min · **Branch:** `step-2` · **Next:** `step-3`

## Objective

The provider call now lives on the server behind auth, a rate limit and a timeout. Now stop
trusting what goes **into** the model and what comes **out** of it: bound the question, check the
answer against the contract, and treat model text as untrusted data.

## What is insecure right now

1. `POST /api/assistant` accepts a question of **any length and format** (empty after trimming,
   2,500+ characters, ...). **(B)**
2. The model response goes **raw to the UI** (`{ raw }`) without schema validation; the web casts
   it to `Insight` and breaks on malformed output. **(B)**
3. `POST /api/data/report` and `POST /api/assistant` take **`tenantId` from the request body**;
   viewers can read risk reports. **(C)**
4. The assistant route **logs all request headers and the body** (now with the Authorization
   header). **(D)**

Today you fix 1 and 2. The others are the next exercises.

## Files to change

```sh
grep -rn "WORKSHOP(B)" apps packages
```

## Steps

1. **Contracts:** in `packages/contracts/src/index.ts`, make `AskRequestSchema.question` trimmed,
   non-empty and at most 2,000 characters.
2. **API:** validate the request body with `AskRequestSchema` (extend it with `tenantId` for now)
   and answer `400` when it fails. The server check is the control.
3. **API:** validate the model output: `JSON.parse(raw)` inside `try/catch`, then
   `InsightSchema.safeParse(...)`. On failure answer
   `502 { error: 'invalid_model_output', fallback: { message } }` (`AssistantFailure`); on success
   answer `200 { insight }` (`AssistantSuccess`).
4. **Web:** use the contract types (`AssistantSuccess`, `AssistantFailure`) in `AssistantService`
   instead of parsing `raw`. Show an error state with the fallback message instead of breaking.
   Optionally use `AskRequestSchema` for a client-side hint (that is UX, not security).
5. **Never execute model text:** no SQL, no shell commands, no HTML. Render it with `{{ }}`
   (Angular escapes it), never `innerHTML`, never pass it to `eval`, `exec` or a database.
6. Try the fixtures in `fixtures/attacks/` (see its README), then run the checks below.

## Hints

- `MOCK_SCENARIO=malformed npm run dev` returns `fixtures/attacks/malformed-response.json`.
- `MOCK_SCENARIO=injection-echo npm run dev` + `fixtures/attacks/goal-hijack.txt`: the answer
  **still passes the schema**. A schema checks shape, not intent: the output stays untrusted data.
- `z.string().trim().min(1).max(2000)` trims before it checks the length.
- `requests/assistant.http` has an authenticated call and a goal-hijack call.
- Log the failure reason (`name`, issue paths), never the raw model text.

## Done when

```sh
npm run check:step     # 400 for 2,001 chars, 502 invalid_model_output on malformed, 200 { insight }
```

> A valid schema is not a safe answer: `injection-echo` is well-formed and still hostile.

## Stuck?

```sh
git stash && git checkout step-3
```
