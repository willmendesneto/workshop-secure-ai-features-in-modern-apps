import { readFileSync } from 'node:fs';
import { LoginRequestSchema, UserSchema } from '@workshop/contracts';
import { Router } from 'express';
import { z } from 'zod';
import { signToken } from '../auth/token.js';
import type { Config } from '../config.js';

// Resolved from this module's location (src/routes or dist/routes), so it works from any cwd.
const usersFile = new URL('../../../../data/users.json', import.meta.url);
const users = z.array(UserSchema).parse(JSON.parse(readFileSync(usersFile, 'utf8')));

export function authRouter(config: Config): Router {
  const router = Router();

  // Fake login for the workshop: knowing a user's email is enough. No passwords on purpose.
  router.post('/login', (req, res) => {
    const body = LoginRequestSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }

    const email = body.data.email.trim().toLowerCase();
    const user = users.find((candidate) => candidate.email === email);
    if (!user) {
      res.status(401).json({ error: 'Unknown user' });
      return;
    }

    res.json({ token: signToken(user, config.authSecret), user });
  });

  return router;
}
