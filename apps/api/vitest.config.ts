import { defineConfig } from 'vitest/config';

// Normal suite (`npm test`). Includes the after-workshop extras (test/extras/*.extra.spec.ts).
// Exercise checks live in test/steps and run via `npm run check:step`.
export default defineConfig({
  test: {
    include: ['test/**/*.spec.ts'],
    setupFiles: ['test/setup.ts'],
    exclude: ['test/steps/**', 'node_modules/**', 'dist/**'],
    // A test without a single expect() fails: an empty test is not a negative test.
    expect: { requireAssertions: true },
  },
});
