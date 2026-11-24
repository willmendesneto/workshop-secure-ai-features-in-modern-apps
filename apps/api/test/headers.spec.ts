// Baseline security headers on every response, plus no-store on the API.
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { testConfig } from './helpers.js';

describe('security headers', () => {
  it('sets nosniff, no-referrer and DENY on every response and no-store on /api', async () => {
    const app = createApp({ config: testConfig });
    const health = await request(app).get('/health');
    const api = await request(app).post('/api/assistant').send({});

    for (const res of [health, api]) {
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['referrer-policy']).toBe('no-referrer');
      expect(res.headers['x-frame-options']).toBe('DENY');
    }
    expect(api.headers['cache-control']).toBe('no-store');
  });

  it('mounts /fake-provider only with the mock provider', async () => {
    const path = '/fake-provider/v1beta/models/gemini-demo:generateContent';
    const res = await request(
      createApp({
        config: { ...testConfig, provider: 'gemini', geminiApiKey: 'wsk_demo_unused' },
      }),
    )
      .post(path)
      .send({});

    expect(res.status).toBe(404);
  });
});
