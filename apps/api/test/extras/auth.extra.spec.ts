// Extra (after the workshop): answer key. On step-4 these tests are todos.
// Offline, mock provider, status and exact body only (never model text).
import { AssistantSuccessSchema } from '@workshop/contracts';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { signToken } from '../../src/auth/token.js';
import { findUserByEmail } from '../../src/data/users.js';
import { bearer, TEST_SECRET, testConfig, tokenFor } from '../helpers.js';

const question = 'Summarize performance this quarter and highlight key risks.';

function ask(authorization?: string) {
  const req = request(createApp({ config: testConfig })).post('/api/assistant');
  if (authorization !== undefined) req.set('Authorization', authorization);
  return req.send({ question });
}

describe('authentication (extras)', () => {
  it('returns 401 { error: "unauthorized" } when the Authorization header is missing on POST /api/assistant', async () => {
    const res = await ask();

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'unauthorized' });
  });

  it('returns 401 { error: "unauthorized" } when the Authorization header is missing on POST /api/data/report', async () => {
    const res = await request(createApp({ config: testConfig }))
      .post('/api/data/report')
      .send({});

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'unauthorized' });
  });

  it('returns 401 { error: "unauthorized" } for a tampered token (payload tenantId "globex", old signature)', async () => {
    const [payload, signature] = tokenFor('alice@acme').split('.');
    const forged = Buffer.from(
      JSON.stringify({
        ...(JSON.parse(Buffer.from(String(payload), 'base64url').toString()) as object),
        tenantId: 'globex',
      }),
    ).toString('base64url');

    const res = await ask(`Bearer ${forged}.${String(signature)}`);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'unauthorized' });
  });

  it('returns 401 { error: "unauthorized" } for an expired token (signed 9 hours ago)', async () => {
    const user = findUserByEmail('alice@acme');
    if (!user) throw new Error('alice@acme missing from the fake users');
    const expired = signToken(user, TEST_SECRET, Date.now() - 9 * 60 * 60 * 1000);

    const res = await ask(`Bearer ${expired}`);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'unauthorized' });
  });

  it('returns 200 and a body that passes AssistantSuccessSchema for bearer("alice@acme") and { question }', async () => {
    const res = await ask(bearer('alice@acme'));

    expect(res.status).toBe(200);
    expect(AssistantSuccessSchema.safeParse(res.body).success).toBe(true);
  });
});
