import { defineConfig } from 'vitest/config';

// Exercise "Done when" checks, run by scripts/check-step.mjs. Excluded from `npm test`.
export default defineConfig({
  test: {
    include: ['test/steps/**/*.check.ts'],
  },
});
