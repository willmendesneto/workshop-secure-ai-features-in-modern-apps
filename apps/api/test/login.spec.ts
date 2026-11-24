import { UserSchema } from '@workshop/contracts';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { signToken, verifyToken } from '../src/auth/token.js';
import { z } from 'zod';

const LoginResponseSchema = z.object({ token: z.string(), user: UserSchema });

const secret = 'test-secret';
const alice = {
  userId: 'u-alice',
  email: 'alice@acme',
  tenantId: 'acme',
  role: 'analyst',
} as const;

describe('POST /api/auth/login', () => {
  it('returns a token for a known user that verifies to the right tenant and role', async () => {
    const res = await request(createApp({ config: { authSecret: secret } }))
      .post('/api/auth/login')
      .send({ email: 'alice@acme' });

    expect(res.status).toBe(200);
    const body = LoginResponseSchema.parse(res.body);
    expect(body.user).toEqual(alice);
    const session = verifyToken(body.token, secret);
    expect(session).toMatchObject({ userId: 'u-alice', tenantId: 'acme', role: 'analyst' });
  });

  it('returns 401 for an unknown email', async () => {
    const res = await request(createApp()).post('/api/auth/login').send({ email: 'mallory@evil' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 for an invalid body', async () => {
    const res = await request(createApp()).post('/api/auth/login').send({ email: 42 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 without leaking a stack trace for malformed JSON', async () => {
    const res = await request(createApp())
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":');

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).not.toContain('at ');
  });
});

describe('verifyToken', () => {
  it('returns the session for a valid token', () => {
    expect(verifyToken(signToken(alice, secret), secret)).toEqual(alice);
  });

  it('returns null for a tampered token', () => {
    const [payload, signature] = signToken(alice, secret).split('.');
    const forged = Buffer.from(
      JSON.stringify({
        ...JSON.parse(Buffer.from(String(payload), 'base64url').toString()),
        tenantId: 'globex',
      }),
    ).toString('base64url');

    expect(verifyToken(`${forged}.${String(signature)}`, secret)).toBeNull();
  });

  it('returns null for a token signed with another secret', () => {
    expect(verifyToken(signToken(alice, 'other-secret'), secret)).toBeNull();
  });

  it('returns null for an expired token', () => {
    const nineHoursAgo = Date.now() - 9 * 60 * 60 * 1000;

    expect(verifyToken(signToken(alice, secret, nineHoursAgo), secret)).toBeNull();
  });

  it('returns null for garbage input', () => {
    expect(verifyToken('not-a-token', secret)).toBeNull();
    expect(verifyToken('', secret)).toBeNull();
  });
});
