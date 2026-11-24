# Secure AI Features in Modern Apps — Workshop

A small SaaS for company analysis with an AI assistant. Ask _"Summarize Acme's performance this
quarter and highlight key risks"_ and get an **Insight**: summary, risk level, recommendations.

It works in the demo. It is still insecure in production. You fix it in four exercises (A–D),
one checkpoint branch each. Instructions for the current exercise are in [STEP.md](STEP.md).

## Quick start

Prerequisites: **Node 24** (`nvm use`) and git.

```sh
npm ci
npm run dev          # API on http://localhost:3000, UI on http://localhost:4200
```

Open http://localhost:4200 and sign in as one of the fake users:

| User         | Role    | Tenant | Notes                        |
| ------------ | ------- | ------ | ---------------------------- |
| `alice@acme` | analyst | acme   | Can read Acme risk reports   |
| `bob@globex` | analyst | globex | Can read Globex risk reports |
| `carol@acme` | viewer  | acme   | Must NOT read risk reports   |

No passwords: the login is fake on purpose. All company data is fictional.

## Branches

| Branch   | Exercise                                              | Minutes |
| -------- | ----------------------------------------------------- | ------- |
| `step-1` | A: move the provider call to the backend              | 05–15   |
| `step-2` | B: validate input and model output (A solved)         | 15–25   |
| `step-3` | C: tenant and permissions from the session (B solved) | 25–40   |
| `step-4` | D: negative tests and logs without secrets (C solved) | 40–52   |
| `main`   | D solved, closing (answer key)                        | 52–60   |

Switch checkpoints (discards nothing: your work, including new files, goes to the stash):

```sh
git stash -u && git checkout step-2
npm ci               # only if package-lock.json changed
```

Check your exercise: `npm run check:step` (or `node scripts/check-step.mjs --exercise B`).
On `main` (`workshop.json` step 5) it runs the checks of every exercise, A to D.

After the workshop: [CHECKLIST.md](CHECKLIST.md) (production checklist for AI features) and
[docs/before-after.md](docs/before-after.md) (what changed from `step-1` to `main`).

## Mock provider (default, offline)

No key and no network needed. Pick the behaviour with `MOCK_SCENARIO` in `.env` (copy
`.env.example` to `.env` in the repo root; `npm run dev` loads it):

| `MOCK_SCENARIO`  | The "model" returns                                                 |
| ---------------- | ------------------------------------------------------------------- |
| `ok`             | a valid Insight (default)                                           |
| `malformed`      | JSON with missing and wrongly typed fields                          |
| `injection-echo` | if the question tries an injection: the system prompt, HTML and SQL |
| `slow`           | a valid Insight after `MOCK_SLOW_MS` (default 15 s)                 |

`/fake-provider/...` is a simulated third-party API served by the API process (only the `step-1`
browser calls it directly). It is not part of the app.

## Optional: real provider

Server-side only, in `.env` (never commit it):

```sh
PROVIDER=gemini          # default choice for the demo
GEMINI_API_KEY=...
# or
PROVIDER=openai
OPENAI_API_KEY=...
```

The API refuses to start if the selected provider has no key. Tests always use the mock.

> **Warning:** never put a real key in `.env` while on `step-1`..`step-4`: those endpoints are
> insecure on purpose. Use a capped, short-lived key, and only on `main`. The servers listen on
> `127.0.0.1` only (`HOST` in `.env`), so they are not exposed to your network.

## Scripts

| Script                    | What it does                                                  |
| ------------------------- | ------------------------------------------------------------- |
| `npm run dev`             | contracts watch + API (:3000) + UI (:4200)                    |
| `npm test`                | offline tests (Vitest + supertest)                            |
| `npm run check:step`      | "Done when" checks for the current exercise                   |
| `npm run check:bundle`    | builds the UI and fails if a key-like string is in the bundle |
| `npm run check:bundle:ci` | CI mode: on step 1 the leak is expected                       |
| `npm run validate`        | format check, lint, typecheck, test, build                    |
| `npm run format`          | Prettier write                                                |

HTTP samples for VS Code REST Client: [requests/](requests/). Attack inputs for the exercises:
[fixtures/attacks/](fixtures/attacks/README.md).
More docs: [docs/README.md](docs/README.md).

## Common problems

**Port 3000 or 4200 in use**

```sh
lsof -i :3000 -i :4200      # find the PID
kill <PID>
```

On Windows (cmd or PowerShell):

```sh
netstat -ano | findstr :3000
taskkill /PID <pid> /F
```

**Switching `MOCK_SCENARIO`** — edit `MOCK_SCENARIO=` in `.env` and restart `npm run dev` (works
on every OS). On macOS/Linux you can also run `MOCK_SCENARIO=malformed npm run dev` for one run.

**Wrong Node version** — `npm ci` fails with `EBADENGINE ... Unsupported engine` because
`engine-strict` is on. Run `nvm use` (reads `.nvmrc`, Node 24) and retry.

**Corporate proxy** — point npm at it, then `npm ci` again:

```sh
npm config set proxy http://proxy.example:8080
npm config set https-proxy http://proxy.example:8080
```

**Plan B: no local setup** — GitHub Codespaces: **Code → Codespaces → Create codespace on
step-1**. Or in VS Code with Docker: **Dev Containers: Reopen in Container**. Both run `npm ci`
for you.
