# Attack fixtures

Inputs and outputs that break a naive AI feature. Use them in Exercise B (and later to write the
negative tests in Exercise D). All content is fictional.

| File                         | What it is                                                   | Expected after Exercise B                    |
| ---------------------------- | ------------------------------------------------------------ | -------------------------------------------- |
| `goal-hijack.txt`            | A question that tries to change the assistant's goal         | Rendered as plain text, never acted on       |
| `instruction-extraction.txt` | A question that tries to extract the system prompt           | Rendered as plain text, never acted on       |
| `oversize.txt`               | A realistic question longer than 2,000 characters            | `400` from the API (and a hint in the UI)    |
| `malformed-response.json`    | What the mock "model" returns with `MOCK_SCENARIO=malformed` | `502 { error: 'invalid_model_output', ... }` |

## How to use them

- **UI:** sign in as `alice@acme` and paste the text of a `.txt` file into the question box.
- **HTTP:** [requests/assistant.http](../../requests/assistant.http) has a login, a normal call and
  a goal-hijack call (VS Code REST Client).
- **Scenarios:** restart the app with a different mock behaviour:

```sh
MOCK_SCENARIO=malformed npm run dev        # the model returns malformed-response.json
MOCK_SCENARIO=injection-echo npm run dev   # the injection "works": system prompt, HTML and SQL
```

With `injection-echo`, `goal-hijack.txt` and `instruction-extraction.txt` get an answer that
still matches `InsightSchema`. The schema checks shape, not intent: treat the text as untrusted
data and render it as text only.
