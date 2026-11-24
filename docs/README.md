# Docs router

Where things live and what to read before changing them.

| Area                     | Paths (globs)                                                                                                                                     | Read                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| api                      | `apps/api/src/**` (`app.ts`, `config.ts`, `routes/**`, `auth/**`)                                                                                 | [architecture.md](architecture.md), [AGENTS.md](../AGENTS.md)       |
| web                      | `apps/web/src/**`                                                                                                                                 | [architecture.md](architecture.md)                                  |
| contracts                | `packages/contracts/src/index.ts`                                                                                                                 | Zod schemas shared by api and web                                   |
| providers                | `apps/api/src/providers/**`, `apps/api/src/routes/fake-provider.ts`                                                                               | [architecture.md](architecture.md#providers)                        |
| data                     | `data/*.json`, `apps/api/src/data/**`                                                                                                             | Synthetic, fictional data only                                      |
| scripts/workshop tooling | `scripts/*.mjs`, `workshop.json`, `STEP.md`, `requests/*.http`, `fixtures/**`                                                                     | [README.md](../README.md#scripts)                                   |
| security model           | trust boundaries, controls per exercise                                                                                                           | [trust-boundaries.md](trust-boundaries.md)                          |
| database (optional)      | Row-Level Security as an extra tenant layer (docs only, no database in this repo)                                                                 | [rls.md](rls.md)                                                    |
| tests                    | `apps/api/test/**/*.spec.ts` (after-workshop extras in `apps/api/test/extras/**`), `apps/api/test/steps/*.check.ts`, `packages/contracts/test/**` | [AGENTS.md](../AGENTS.md#hard-rules)                                |
| closing                  | `step-1` → `main` summary, production checklist                                                                                                   | [before-after.md](before-after.md), [CHECKLIST.md](../CHECKLIST.md) |
| branch maintenance       | `scripts/restack.sh`, `scripts/verify-steps.sh`                                                                                                   | [maintainers.md](maintainers.md)                                    |
