// Extra (after the workshop): answer key. On step-4 these tests are todos.
// Logs are a data export: no provider key, no question, no report content. Captured from stdout.
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app.js';
import { getReport } from '../../src/data/reports.js';
import { redact } from '../../src/logger.js';
import { bearer, testConfig } from '../helpers.js';

const question = 'Summarize performance this quarter and highlight key risks.';

function captureLogs() {
  const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  return () => write.mock.calls.map(([chunk]) => String(chunk)).join('');
}

function post(path: string, body: object) {
  return request(createApp({ config: testConfig }))
    .post(path)
    .set('Authorization', bearer('alice@acme'))
    .send(body);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('logs without secrets (extras)', () => {
  it('never writes testConfig.fakeProviderKey (or any wsk_demo_ key) during a full assistant request', async () => {
    const logs = captureLogs();

    const res = await post('/api/assistant', { question });

    expect(res.status).toBe(200);
    expect(logs()).not.toContain(testConfig.fakeProviderKey);
    expect(logs()).not.toContain('wsk_demo_');
  });

  it('never writes the full report: no risk detail from getReport("acme") after /api/data/report and /api/assistant', async () => {
    const detail = getReport('acme')?.quarters.flatMap((quarter) => quarter.risks)[0]?.detail;
    if (!detail) throw new Error('acme report has no risk detail');
    const logs = captureLogs();

    await post('/api/data/report', {});
    await post('/api/assistant', { question });

    expect(logs()).not.toContain(detail);
    expect(logs()).not.toContain(question);
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
