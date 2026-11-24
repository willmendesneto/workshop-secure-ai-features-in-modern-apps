// WORKSHOP(D): no test to write here during the workshop. The authentication todos are extras:
// ./extras/auth.extra.spec.ts (after the workshop). The test below is a worked example of the
// pattern (status and exact body, mock provider, no network) to copy for the core todos.
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
