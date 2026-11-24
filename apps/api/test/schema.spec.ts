// WORKSHOP(D): no test to write here during the workshop. The model output todos are extras:
// ./extras/schema.extra.spec.ts (after the workshop). The test below is a worked example of the
// pattern (status and exact body, no echo of the input) to copy for the core todos.
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { bearer, testConfig } from './helpers.js';

describe('request and model output validation', () => {
  it('returns 400 { error: "invalid_request", issues: ["question"] } when question is missing (worked example)', async () => {
    const res = await request(createApp({ config: testConfig }))
      .post('/api/assistant')
      .set('Authorization', bearer('alice@acme'))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'invalid_request', issues: ['question'] });
  });
});
