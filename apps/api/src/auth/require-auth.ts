// Ready for Exercise A: not wired into any route yet.
import type { SessionUser } from '@workshop/contracts';
import type { RequestHandler, Response } from 'express';
import { verifyToken } from './token.js';

/** Rejects requests without a valid `Authorization: Bearer <token>` with 401. */
export function requireAuth(secret: string): RequestHandler {
  return (req, res, next) => {
    const [scheme, token] = (req.headers.authorization ?? '').split(' ');
    const user = scheme === 'Bearer' && token ? verifyToken(token, secret) : null;
    if (!user) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    res.locals.user = user;
    next();
  };
}

/** The session user stored by requireAuth. Only call it on routes behind requireAuth. */
export function sessionUser(res: Response): SessionUser {
  return res.locals.user as SessionUser;
}
