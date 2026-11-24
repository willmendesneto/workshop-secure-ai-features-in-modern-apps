// Authentication: no core test here. The other authentication tests are extras (answer key in
// ./extras/auth.extra.spec.ts). The test below is the worked example of the pattern (status and
// exact body, mock provider, no network) used for the core tests.
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { testConfig } from './helpers.js';

describe('POST /api/assistant authentication', () => {
  it('returns 401 { error: "unauthorized" } for a malformed bearer token (worked example)', async () => {
    const res = await request(createApp({ config: testConfig }))
      .post('/api/assistant')
      .set('Authorization', 'Bearer not-a-token')
      .send({ question: 'Summarize performance this quarter.' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'unauthorized' });
  });
});
