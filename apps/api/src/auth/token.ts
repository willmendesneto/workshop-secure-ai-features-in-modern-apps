// Fake-login session tokens: base64url(JSON payload) + "." + base64url(HMAC-SHA256 signature).
// Good enough for the workshop; use a vetted library (e.g. JWT via `jose`) in production.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { UserSchema, type SessionUser } from '@workshop/contracts';
import { z } from 'zod';

const TOKEN_TTL_SECONDS = 8 * 60 * 60;

const TokenPayloadSchema = UserSchema.extend({ exp: z.number().int() });

function sign(encodedPayload: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(encodedPayload).digest();
}

/** Signs a token for `user` that expires 8 hours after `issuedAtMs`. */
export function signToken(user: SessionUser, secret: string, issuedAtMs = Date.now()): string {
  const payload = {
    userId: user.userId,
    email: user.email,
    tenantId: user.tenantId,
    role: user.role,
    exp: Math.floor(issuedAtMs / 1000) + TOKEN_TTL_SECONDS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encodedPayload}.${sign(encodedPayload, secret).toString('base64url')}`;
}

/** Returns the session user for a valid, unexpired token, otherwise null. Never throws. */
export function verifyToken(token: string, secret: string, nowMs = Date.now()): SessionUser | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encodedPayload = '', encodedSignature = ''] = parts;

  const expected = sign(encodedPayload, secret);
  const provided = Buffer.from(encodedSignature, 'base64url');
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;

  let decoded: unknown;
  try {
    decoded = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  const result = TokenPayloadSchema.safeParse(decoded);
  if (!result.success || result.data.exp * 1000 <= nowMs) return null;

  const { userId, email, tenantId, role } = result.data;
  return { userId, email, tenantId, role };
}
