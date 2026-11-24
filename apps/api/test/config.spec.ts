// AUTH_SECRET guard: production refuses to start with a missing, default or short secret.
// Dev and test keep working with the defaults.
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';

const strongSecret = 'x'.repeat(32);

describe('loadConfig AUTH_SECRET guard', () => {
  it('throws in production when AUTH_SECRET is not set', () => {
    expect(() => loadConfig({ NODE_ENV: 'production' })).toThrow(/AUTH_SECRET/);
  });

  it('throws in production for the dev default, the .env.example value or a secret under 32 characters', () => {
    for (const secret of ['dev-only-secret-change-me', 'change-me-dev-only', 'x'.repeat(31)]) {
      expect(() => loadConfig({ NODE_ENV: 'production', AUTH_SECRET: secret })).toThrow(
        /AUTH_SECRET/,
      );
    }
  });

  it('accepts a 32-character secret in production', () => {
    expect(loadConfig({ NODE_ENV: 'production', AUTH_SECRET: strongSecret }).authSecret).toBe(
      strongSecret,
    );
  });

  it('keeps the dev default outside production', () => {
    expect(loadConfig({}).authSecret).toBe('dev-only-secret-change-me');
    expect(loadConfig({ NODE_ENV: 'development' }).nodeEnv).toBe('development');
  });
});
