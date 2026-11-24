// "Done when" contract for Exercise C. Run with `npm run check:step` (not part of `npm test`).
import { CompanyReportSchema } from '@workshop/contracts';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import type { LlmProvider } from '../../src/providers/types.js';
import { bearer, testConfig } from '../helpers.js';

const question = 'Summarize performance this quarter and highlight key risks.';

/** Records the prompts it receives and answers with a fixed valid insight (no model text asserted). */
function recordingProvider(): LlmProvider & { prompts: { system: string; user: string }[] } {
  const prompts: { system: string; user: string }[] = [];
  return {
    prompts,
    generate(input) {
      prompts.push(input);
      return Promise.resolve(
        JSON.stringify({ summary: 'Fixed.', riskLevel: 'low', recommendations: ['Fixed.'] }),
      );
    },
  };
}

describe('Exercise C: tenant and permissions come from the session', () => {
  it('returns 403 when alice@acme sends tenantId "globex" to POST /api/assistant', async () => {
    const res = await request(createApp({ config: testConfig }))
      .post('/api/assistant')
      .set('Authorization', bearer('alice@acme'))
      .send({ question, tenantId: 'globex' });

    expect(res.status).toBe(403);
  });

  it('returns 200 when alice@acme sends no tenantId (taken from the session)', async () => {
    const res = await request(createApp({ config: testConfig }))
      .post('/api/assistant')
      .set('Authorization', bearer('alice@acme'))
      .send({ question });

    expect(res.status).toBe(200);
  });

  it('returns 403 for carol@acme (viewer) on POST /api/assistant', async () => {
    const res = await request(createApp({ config: testConfig }))
      .post('/api/assistant')
      .set('Authorization', bearer('carol@acme'))
      .send({ question, tenantId: 'acme' });

    expect(res.status).toBe(403);
  });

  it('returns 403 for carol@acme (viewer) on POST /api/data/report', async () => {
    const res = await request(createApp({ config: testConfig }))
      .post('/api/data/report')
      .set('Authorization', bearer('carol@acme'))
      .send({ tenantId: 'acme' });

    expect(res.status).toBe(403);
  });

  it('returns the globex report to bob@globex from POST /api/data/report', async () => {
    const res = await request(createApp({ config: testConfig }))
      .post('/api/data/report')
      .set('Authorization', bearer('bob@globex'))
      .send({});

    expect(res.status).toBe(200);
    expect(CompanyReportSchema.parse(res.body).tenantId).toBe('globex');
  });

  it('builds the assistant prompt from the globex report for bob@globex', async () => {
    const provider = recordingProvider();
    const res = await request(createApp({ config: testConfig, provider }))
      .post('/api/assistant')
      .set('Authorization', bearer('bob@globex'))
      .send({ question });

    expect(res.status).toBe(200);
    const prompt = provider.prompts.map((p) => `${p.system}\n${p.user}`).join('\n');
    expect(prompt).toContain('"tenantId":"globex"');
    expect(prompt).not.toContain('"tenantId":"acme"');
  });
});
