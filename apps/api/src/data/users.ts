import { readFileSync } from 'node:fs';
import { UserSchema, type SessionUser } from '@workshop/contracts';
import { z } from 'zod';

// Resolved from this module's location (src/data or dist/data), so it works from any cwd.
const usersFile = new URL('../../../../data/users.json', import.meta.url);

/** The fake workshop users (data/users.json), validated at startup. */
export const users: readonly SessionUser[] = z
  .array(UserSchema)
  .parse(JSON.parse(readFileSync(usersFile, 'utf8')));

/** Case-insensitive lookup by email. */
export function findUserByEmail(email: string): SessionUser | undefined {
  const normalized = email.trim().toLowerCase();
  return users.find((candidate) => candidate.email === normalized);
}
