// Tenant isolation and role checks: tenant and role come from the session, never from the body.
import { CompanyReportSchema } from '@workshop/contracts';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { LlmProvider } from '../src/providers/types.js';
import { bearer, testConfig } from './helpers.js';

const question = 'Summarize performance this quarter and highlight key risks.';

/** Records the prompts it receives and answers with a fixed valid insight. */
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

function post(path: string, email: string, body: object, provider?: LlmProvider) {
  return request(createApp({ config: testConfig, ...(provider ? { provider } : {}) }))
    .post(path)
    .set('Authorization', bearer(email))
    .send(body);
}

describe('tenant isolation and permissions', () => {
  it('returns 403 { error: "forbidden" } when alice@acme sends { question, tenantId: "globex" } to POST /api/assistant', async () => {
    const res = await post('/api/assistant', 'alice@acme', { question, tenantId: 'globex' });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'forbidden' });
  });

  it('returns 403 { error: "forbidden" } when alice@acme sends { tenantId: "globex" } to POST /api/data/report', async () => {
    const res = await post('/api/data/report', 'alice@acme', { tenantId: 'globex' });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'forbidden' });
  });

  it('returns 200 when alice@acme sends { question } without tenantId (acme from the session)', async () => {
    const provider = recordingProvider();
    const res = await post('/api/assistant', 'alice@acme', { question }, provider);

    expect(res.status).toBe(200);
    const prompt = provider.prompts.map((p) => `${p.system}\n${p.user}`).join('\n');
    expect(prompt).toContain('"tenantId":"acme"');
  });

  it('returns 403 { error: "forbidden" } for carol@acme (viewer) on POST /api/data/report with {}', async () => {
    const res = await post('/api/data/report', 'carol@acme', {});

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'forbidden' });
  });

  it('returns 403 { error: "forbidden" } for carol@acme (viewer) on POST /api/assistant with { question }', async () => {
    const provider = recordingProvider();
    const res = await post('/api/assistant', 'carol@acme', { question }, provider);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'forbidden' });
    expect(provider.prompts).toHaveLength(0);
  });

  it('returns 200 for bob@globex: POST /api/data/report {} has tenantId "globex" and the assistant prompt uses the globex report', async () => {
    const report = await post('/api/data/report', 'bob@globex', {});

    expect(report.status).toBe(200);
    expect(CompanyReportSchema.parse(report.body).tenantId).toBe('globex');

    const provider = recordingProvider();
    const res = await post('/api/assistant', 'bob@globex', { question }, provider);

    expect(res.status).toBe(200);
    const prompt = provider.prompts.map((p) => `${p.system}\n${p.user}`).join('\n');
    expect(prompt).toContain('"tenantId":"globex"');
    expect(prompt).not.toContain('"acme"');
  });
});
