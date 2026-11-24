// Logs are a data export (core D tests): no token, no Authorization header, no body.
// More log tests (provider key, report content, redaction) are extras: ./extras/logs.extra.spec.ts.
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { bearer, testConfig, tokenFor } from './helpers.js';

const question = 'Summarize performance this quarter and highlight key risks.';

/** Sends one assistant request as alice@acme and returns its status and what was written to stdout. */
async function logsOfOneRequest(): Promise<{ status: number; logs: string }> {
  const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  const res = await request(createApp({ config: testConfig }))
    .post('/api/assistant')
    .set('Authorization', bearer('alice@acme'))
    .send({ question });
  const logs = write.mock.calls.map(([chunk]) => String(chunk)).join('');
  return { status: res.status, logs };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('logs without secrets', () => {
  it('never writes the Authorization header or the bearer token (POST /api/assistant as alice@acme)', async () => {
    const { status, logs } = await logsOfOneRequest();

    expect(status).toBe(200);
    expect(logs).not.toContain(tokenFor('alice@acme'));
    expect(logs.toLowerCase()).not.toContain('authorization');
    expect(logs).not.toContain('Bearer');
  });

  it('writes one "assistant request" line with method, path, userId, tenantId, status and durationMs (and no body)', async () => {
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
    expect(line).not.toHaveProperty('body');
    expect(line).not.toHaveProperty('headers');
    expect(line).not.toHaveProperty('question');
    expect(logs).not.toContain(question);
  });
});
