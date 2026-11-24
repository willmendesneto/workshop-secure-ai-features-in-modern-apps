import { defineConfig } from 'vitest/config';

// Normal suite (`npm test`). Exercise checks live in test/steps and run via `npm run check:step`.
export default defineConfig({
  test: {
    include: ['test/**/*.spec.ts'],
    setupFiles: ['test/setup.ts'],
    exclude: ['test/steps/**', 'node_modules/**', 'dist/**'],
  },
});
