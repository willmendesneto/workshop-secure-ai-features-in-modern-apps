// Logs are a data export: no tokens, keys, questions or report content. Captured from stdout.
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { getReport } from '../src/data/reports.js';
import { redact } from '../src/logger.js';
import { bearer, testConfig, tokenFor } from './helpers.js';

const question = 'Summarize performance this quarter and highlight key risks.';

function captureLogs() {
  const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  return () => write.mock.calls.map(([chunk]) => String(chunk)).join('');
}

function ask(email = 'alice@acme') {
  return request(createApp({ config: testConfig }))
    .post('/api/assistant')
    .set('Authorization', bearer(email))
    .send({ question });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('logs without secrets', () => {
  it('never writes the Authorization header or the bearer token (POST /api/assistant as alice@acme)', async () => {
    const logs = captureLogs();

    const res = await ask();

    expect(res.status).toBe(200);
    expect(logs()).not.toContain(tokenFor('alice@acme'));
    expect(logs().toLowerCase()).not.toContain('authorization');
    expect(logs()).not.toContain('Bearer');
  });

  it('never writes testConfig.fakeProviderKey (or any wsk_demo_ key) during a full assistant request', async () => {
    const logs = captureLogs();

    await ask();

    expect(logs()).not.toContain(testConfig.fakeProviderKey);
    expect(logs()).not.toContain('wsk_demo_');
  });

  it('never writes the full report: no risk detail from getReport("acme") after /api/data/report and /api/assistant', async () => {
    const detail = getReport('acme')?.quarters.flatMap((quarter) => quarter.risks)[0]?.detail;
    if (!detail) throw new Error('acme report has no risk detail');
    const logs = captureLogs();

    await request(createApp({ config: testConfig }))
      .post('/api/data/report')
      .set('Authorization', bearer('alice@acme'))
      .send({});
    await ask();

    expect(logs()).not.toContain(detail);
    expect(logs()).not.toContain(question);
  });

  it('writes one "assistant request" line with method, path, userId, tenantId, status and durationMs (and no body)', async () => {
    const logs = captureLogs();

    await ask();

    const lines = logs()
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
  });
});

describe('logger redaction (defense in depth)', () => {
  it('replaces sensitive keys with "[REDACTED]", recursively in plain objects', () => {
    expect(
      redact({
        userId: 'u-alice',
        headers: { authorization: 'Bearer abc', 'content-type': 'application/json' },
        nested: { apiKey: 'wsk_demo_x', api_key: 'k', password: 'p', refreshToken: 't' },
        list: [{ clientSecret: 's' }],
      }),
    ).toEqual({
      userId: 'u-alice',
      headers: { authorization: '[REDACTED]', 'content-type': 'application/json' },
      nested: {
        apiKey: '[REDACTED]',
        api_key: '[REDACTED]',
        password: '[REDACTED]',
        refreshToken: '[REDACTED]',
      },
      list: [{ clientSecret: '[REDACTED]' }],
    });
  });
});
