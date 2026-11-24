# Docs router

Where things live and what to read before changing them.

| Area                     | Paths (globs)                                                                                | Read                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| api                      | `apps/api/src/**` (`app.ts`, `config.ts`, `routes/**`, `auth/**`)                            | [architecture.md](architecture.md), [AGENTS.md](../AGENTS.md) |
| web                      | `apps/web/src/**`                                                                            | [architecture.md](architecture.md)                            |
| contracts                | `packages/contracts/src/index.ts`                                                            | Zod schemas shared by api and web                             |
| providers                | `apps/api/src/providers/**`, `apps/api/src/routes/fake-provider.ts`                          | [architecture.md](architecture.md#providers)                  |
| data                     | `data/*.json`, `apps/api/src/data/**`                                                        | Synthetic, fictional data only                                |
| scripts/workshop tooling | `scripts/*.mjs`, `workshop.json`, `STEP.md`, `requests/*.http`, `fixtures/**`                | [README.md](../README.md#scripts)                             |
| security model           | trust boundaries, controls per exercise                                                      | [trust-boundaries.md](trust-boundaries.md)                    |
| tests                    | `apps/api/test/**/*.spec.ts`, `apps/api/test/steps/*.check.ts`, `packages/contracts/test/**` | [AGENTS.md](../AGENTS.md#hard-rules)                          |
