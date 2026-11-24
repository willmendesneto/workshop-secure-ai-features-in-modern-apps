// "Done when" contract for Exercise B. Run with `npm run check:step` (not part of `npm test`).
import { AssistantFailureSchema, AssistantSuccessSchema } from '@workshop/contracts';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { bearer, testConfig } from '../helpers.js';

const question = 'Summarize Acme performance this quarter and highlight key risks.';

describe('Exercise B: validate input and model output', () => {
  it('returns 400 for a question of 2,001 characters', async () => {
    const res = await request(createApp({ config: testConfig }))
      .post('/api/assistant')
      .set('Authorization', bearer('alice@acme'))
      .send({ question: 'a'.repeat(2001), tenantId: 'acme' });

    expect(res.status).toBe(400);
  });

  it('returns 502 { error: "invalid_model_output", fallback } for malformed model output', async () => {
    const res = await request(createApp({ config: { ...testConfig, mockScenario: 'malformed' } }))
      .post('/api/assistant')
      .set('Authorization', bearer('alice@acme'))
      .send({ question, tenantId: 'acme' });

    expect(res.status).toBe(502);
    const body = AssistantFailureSchema.parse(res.body);
    expect(body.error).toBe('invalid_model_output');
    expect(typeof body.fallback?.message).toBe('string');
  });

  it('returns 200 { insight } that passes InsightSchema for valid model output', async () => {
    const res = await request(createApp({ config: testConfig }))
      .post('/api/assistant')
      .set('Authorization', bearer('alice@acme'))
      .send({ question, tenantId: 'acme' });

    expect(res.status).toBe(200);
    expect(AssistantSuccessSchema.safeParse(res.body).success).toBe(true);
  });
});
