import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { testConfig } from './helpers.js';

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(createApp({ config: testConfig })).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
