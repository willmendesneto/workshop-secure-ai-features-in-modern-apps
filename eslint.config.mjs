// @ts-check
// Root ESLint flat config. Security guardrails live here so every workspace gets them.
import eslint from '@eslint/js';
import angular from 'angular-eslint';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** Rules that apply to every TypeScript file in the repo. */
const securityBaseline = {
  'no-eval': 'error',
  'no-new-func': 'error',
  '@typescript-eslint/no-implied-eval': 'error',
  '@typescript-eslint/no-explicit-any': 'error',
};

export default defineConfig(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.angular/**',
      '**/coverage/**',
      '**/out-tsc/**',
    ],
  },

  // TypeScript sources and tests: strict, type-aware.
  {
    files: ['**/*.ts'],
    extends: [eslint.configs.recommended, ...tseslint.configs.strictTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...securityBaseline,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' },
      ],
    },
  },

  // API: Node only. No shelling out, no console, env access only through src/config.ts.
  {
    files: ['apps/api/**/*.ts'],
    languageOptions: { globals: globals.node },
    rules: {
      'no-console': 'error',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'child_process', message: 'Do not spawn processes from the API.' },
            { name: 'node:child_process', message: 'Do not spawn processes from the API.' },
            {
              name: 'process',
              importNames: ['env'],
              message: 'Read configuration through src/config.ts.',
            },
            {
              name: 'node:process',
              importNames: ['env'],
              message: 'Read configuration through src/config.ts.',
            },
          ],
        },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'env',
          message: 'Read configuration through src/config.ts.',
        },
      ],
    },
  },
  {
    files: ['apps/api/src/config.ts'],
    rules: { 'no-restricted-properties': 'off' },
  },

  // Web: Angular rules for TypeScript, no Angular sanitizer bypasses.
  {
    files: ['apps/web/**/*.ts'],
    extends: [...angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    languageOptions: { globals: globals.browser },
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.property.name=/^bypassSecurityTrust/]',
          message: 'Do not bypass Angular sanitization. Render model output as text.',
        },
      ],
    },
  },

  // Web templates: Angular template rules, no raw HTML bindings.
  {
    files: ['apps/web/**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'BoundAttribute[name="innerHTML"]',
          message: 'Do not bind [innerHTML]. Render model output as text with {{ }}.',
        },
      ],
    },
  },

  // Scripts and config files: plain JS, relaxed (no type-aware rules).
  {
    files: ['**/*.mjs', '**/*.js', '**/*.cjs'],
    extends: [eslint.configs.recommended],
    languageOptions: { globals: globals.node, sourceType: 'module' },
    rules: {
      'no-eval': 'error',
      'no-new-func': 'error',
    },
  },
);
