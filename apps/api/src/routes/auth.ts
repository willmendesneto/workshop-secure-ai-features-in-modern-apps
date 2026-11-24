import { LoginRequestSchema } from '@workshop/contracts';
import { Router } from 'express';
import { signToken } from '../auth/token.js';
import type { Config } from '../config.js';
import { findUserByEmail } from '../data/users.js';

export function authRouter(config: Config): Router {
  const router = Router();

  // Fake login for the workshop: knowing a user's email is enough. No passwords on purpose.
  router.post('/login', (req, res) => {
    const body = LoginRequestSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }

    const user = findUserByEmail(body.data.email);
    if (!user) {
      res.status(401).json({ error: 'Unknown user' });
      return;
    }

    res.json({ token: signToken(user, config.authSecret), user });
  });

  return router;
}
