// Request and model output validation: no core test here. The model output tests are extras
// (answer key in ./extras/schema.extra.spec.ts). The test below is the worked example of the
// pattern (status and exact body, no echo of the input) used for the core tests.
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
