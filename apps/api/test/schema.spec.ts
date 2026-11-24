// WORKSHOP(D): implement these tests. They must not depend on network or on model text.
// Use createApp({ config: testConfig }) and the helpers in ./helpers.ts. Mock provider only.
import { describe, it } from 'vitest';

describe('model output validation', () => {
  it.todo(
    'returns 502 { error: "invalid_model_output", fallback: { message } } for mockScenario "malformed"',
  );
  // Assert: status 200, body.insight passes InsightSchema, the HTML payload is a plain string
  // inside insight.summary (JSON, content-type application/json, never text/html), and nothing
  // in the API parses or executes it (no SQL, no shell, no HTML rendering on the server).
  it.todo('returns injection-echo HTML only as plain JSON text, never executed or rendered');
  it.todo('returns 200 { insight } that passes InsightSchema for mockScenario "ok"');
});
