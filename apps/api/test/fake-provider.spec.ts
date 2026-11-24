import { InsightSchema } from '@workshop/contracts';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApp } from '../src/app.js';
import { testConfig } from './helpers.js';

const GeminiResponseSchema = z.object({
  candidates: z
    .array(z.object({ content: z.object({ parts: z.array(z.object({ text: z.string() })) }) }))
    .min(1),
});

const path = '/fake-provider/v1beta/models/gemini-demo:generateContent';
const geminiBody = {
  systemInstruction: { parts: [{ text: 'Reply only with JSON.' }] },
  contents: [{ role: 'user', parts: [{ text: 'Company data: {"company":"Acme Corp"}' }] }],
};

describe('fake provider (simulated third-party LLM API)', () => {
  it('returns 401 without a key', async () => {
    const res = await request(createApp({ config: testConfig }))
      .post(path)
      .send(geminiBody);
    expect(res.status).toBe(401);
  });

  it('returns 401 with a wrong key', async () => {
    const res = await request(createApp({ config: testConfig }))
      .post(`${path}?key=wsk_demo_wrong000`)
      .send(geminiBody);
    expect(res.status).toBe(401);
  });

  it('returns 400 for a body that is not Gemini-shaped', async () => {
    const res = await request(createApp({ config: testConfig }))
      .post(`${path}?key=${testConfig.fakeProviderKey}`)
      .send({ prompt: 'hi' });
    expect(res.status).toBe(400);
  });

  it('returns a Gemini-shaped response with the right key', async () => {
    const res = await request(createApp({ config: testConfig }))
      .post(`${path}?key=${testConfig.fakeProviderKey}`)
      .send(geminiBody);

    expect(res.status).toBe(200);
    const body = GeminiResponseSchema.parse(res.body);
    const text = body.candidates[0]?.content.parts[0]?.text ?? '';
    expect(InsightSchema.safeParse(JSON.parse(text)).success).toBe(true);
  });
});
