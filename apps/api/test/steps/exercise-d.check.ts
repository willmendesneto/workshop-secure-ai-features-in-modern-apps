// "Done when" contract for Exercise D. Run with `npm run check:step` (not part of `npm test`).
// The assistant route writes one safe line per request: no headers, no token, no body.
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app.js';
import { testConfig, tokenFor } from '../helpers.js';

const question = 'Summarize performance this quarter and highlight key risks.';

/** Sends one assistant request as alice@acme and returns what the API wrote to stdout. */
async function logsOfOneRequest(): Promise<{ status: number; logs: string; token: string }> {
  const token = tokenFor('alice@acme');
  const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  const res = await request(createApp({ config: testConfig }))
    .post('/api/assistant')
    .set('Authorization', `Bearer ${token}`)
    .send({ question });
  const logs = write.mock.calls.map(([chunk]) => String(chunk)).join('');
  return { status: res.status, logs, token };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Exercise D: logs without secrets', () => {
  it('never writes the bearer token or the Authorization header', async () => {
    const { status, logs, token } = await logsOfOneRequest();

    expect(status).toBe(200);
    expect(logs).not.toContain(token);
    expect(logs.toLowerCase()).not.toContain('authorization');
  });

  it('writes one "assistant request" line with method, path, userId, tenantId, status, durationMs and no body', async () => {
    const { logs } = await logsOfOneRequest();

    const lines = logs
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => JSON.parse(line) as Record<string, unknown>);
    const requests = lines.filter((line) => line.msg === 'assistant request');
    expect(requests).toHaveLength(1);
    const [line] = requests;
    expect(line).toMatchObject({
      method: 'POST',
      path: '/api/assistant',
      userId: 'u-alice',
      tenantId: 'acme',
      status: 200,
      durationMs: expect.any(Number) as number,
    });
    expect(line).not.toHaveProperty('question');
    expect(line).not.toHaveProperty('body');
    expect(line).not.toHaveProperty('headers');
    expect(logs).not.toContain(question);
  });
});
