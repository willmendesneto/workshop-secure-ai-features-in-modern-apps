# AGENTS.md

Guide for AI coding agents and maintainers of this workshop repo.

## Purpose

A 60-minute workshop: "Secure AI Features in Modern Apps". A small AI feature that works in the
demo and is insecure in production. Attendees fix it in four exercises (A–D), one branch each.

## Commands

| Command                | What it does                                                  |
| ---------------------- | ------------------------------------------------------------- |
| `npm run dev`          | contracts watch + API on :3000 + UI on :4200                  |
| `npm run validate`     | format check, lint, typecheck, test, build (CI runs this)     |
| `npm test`             | offline unit and HTTP tests (Vitest + supertest)              |
| `npm run check:step`   | "Done when" checks for the current exercise (`workshop.json`) |
| `npm run check:bundle` | builds the web app and fails if a key-like string is in it    |

## Hard rules

- **Branches are linear:** `step-1` → `step-2` → `step-3` → `step-4` → `main`. Fix on the
  earliest branch that has the problem, then restack the later ones (see
  [docs/maintainers.md](docs/maintainers.md)). Never fix only on `main`.
- **`main` is the answer key; keep it green:** all exercises solved, no `WORKSHOP(` markers,
  `npm run validate` and `npm run check:step` (step 5 runs A–D) pass.
- **Every intentional flaw has a marker:** `// WORKSHOP(X): <hint>` (or `<!-- WORKSHOP(X): ... -->`
  in templates), `X` = `A|B|C|D`. Solving an exercise removes its markers.
- **Never commit real keys.** Fake keys use the `wsk_demo_` prefix only. No `.env` in git.
- **Only `apps/api/src/config.ts` reads `process.env`** (ESLint enforces it).
- **Tests are offline** and never assert model wording: use the mock provider, assert on status
  codes, schemas and prompts. `fetch` throws in tests (`apps/api/test/setup.ts`).
- **No `innerHTML`** and no `bypassSecurityTrust*` in the web app. Render model output with `{{ }}`.
- **Tenant scope always comes from the session** (`sessionUser(res)`); call `assertCanRead`
  (`apps/api/src/auth/authorize.ts`) before reading tenant data. A body `tenantId` is only compared.
- No `any`, no `eval`, no `child_process` in the API, no `console` in the API (use `logger`).

## Where things live

See [docs/README.md](docs/README.md) for the area → paths → docs router.
