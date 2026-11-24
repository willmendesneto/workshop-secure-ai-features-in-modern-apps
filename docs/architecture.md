# Architecture (step 3)

> These docs describe the branch you are on. Each checkpoint branch updates them.

Three pieces in one npm workspace:

- **web** (`apps/web`): Angular 21 standalone, zoneless. Login + chat views.
- **api** (`apps/api`): Express 5. Fake login, company data, assistant endpoint.
- **contracts** (`packages/contracts`): Zod schemas shared by both (`Insight`, `CompanyReport`, ...).

The **fake provider** (`/fake-provider/...`, `apps/api/src/routes/fake-provider.ts`) simulates a
third-party LLM API (Gemini-shaped) so the workshop runs offline. It is not part of the app and
the web no longer calls it.

## Request flow on step 3 (Exercises A and B solved)

```mermaid
sequenceDiagram
  autonumber
  box Browser (untrusted)
    participant UI as Angular app<br/>no key, no prompt
  end
  box API (trusted)
    participant API as Express API<br/>key + prompt live here
  end
  box Third party
    participant P as LLM provider<br/>(mock / Gemini / OpenAI)
  end
  UI->>API: POST /api/auth/login { email }
  API-->>UI: { token, user }
  UI->>API: POST /api/assistant { question, tenantId }<br/>Authorization: Bearer token
  Note over API: requireAuth (401) -> rate limit per user (429)<br/>AskRequestSchema: trimmed, 1–2,000 chars (400)
  API->>P: prompt built on the server, AbortSignal (504 after assistantTimeoutMs)
  P-->>API: model text (untrusted)
  Note over API: JSON.parse + InsightSchema.safeParse
  alt valid Insight
    API-->>UI: 200 { insight }
  else malformed
    API-->>UI: 502 { error: invalid_model_output, fallback }
  end
  Note over UI: renders with {{ }} only, error state on 4xx/5xx
```

A valid `Insight` is not a safe one: the schema checks shape, not intent. See
[trust-boundaries.md](trust-boundaries.md).

Still open: `tenantId` comes from the body and there is no role check (C), the route logs headers
and body (D).

## Trust boundaries

| Zone         | Trust       | Why                                                                 |
| ------------ | ----------- | ------------------------------------------------------------------- |
| Browser      | untrusted   | Users can read the bundle, edit requests and change any field.      |
| API          | trusted     | Holds secrets (`config.ts` is the only env reader), owns decisions. |
| Provider     | third party | Sees every prompt; needs a key; can be slow or down.                |
| Model output | untrusted   | Can be malformed or follow an injected instruction. Validate it.    |

## Providers

`apps/api/src/providers/`: `types.ts` (`LlmProvider`), `mock.ts` (offline, deterministic,
`MOCK_SCENARIO` = `ok | malformed | injection-echo | slow`), `gemini.ts`, `openai.ts`,
`index.ts` (`createProvider(config)`). Tests always use the mock, or pass
`createApp({ config, provider })`.
