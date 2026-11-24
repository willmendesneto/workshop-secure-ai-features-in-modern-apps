#!/usr/bin/env node
// Checks whether the current exercise is done.
//
//   npm run check:step                          exercise from workshop.json (1->A, 2->B, 3->C, 4->D,
//                                               5 = main: every exercise, A to D)
//   node scripts/check-step.mjs --exercise B    check one exercise explicitly
//
// Exit code 0 when every check passes, 1 otherwise.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const apiDir = join(repoRoot, 'apps', 'api');
const EXERCISE_BY_STEP = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
const NEXT_BRANCH = { A: 'step-2', B: 'step-3', C: 'step-4', D: 'main' };
// Core D specs. apps/api/test/extras/** is the after-workshop track and is never checked here.
const CORE_SPECS = ['auth', 'tenant', 'schema', 'limits', 'logs'].map((name) =>
  join('apps', 'api', 'test', `${name}.spec.ts`),
);
const TODO_PATTERN = /\b(?:it|test)\.todo\s*\(/;
const SKIP_PATTERN = /\b(?:it|test|describe)\.(?:skip|only)\b/;

function readStep() {
  const workshop = JSON.parse(readFileSync(join(repoRoot, 'workshop.json'), 'utf8'));
  return workshop.step;
}

function pickExercise() {
  const flag = process.argv.indexOf('--exercise');
  if (flag !== -1) {
    const value = String(process.argv[flag + 1] ?? '').toUpperCase();
    if (!['A', 'B', 'C', 'D'].includes(value)) {
      console.error('Usage: node scripts/check-step.mjs [--exercise A|B|C|D]');
      process.exit(2);
    }
    return value;
  }
  const step = readStep();
  if (step === 5) return 'done';
  const exercise = EXERCISE_BY_STEP[step];
  if (!exercise) {
    console.error(`workshop.json has an unknown step: ${JSON.stringify(step)}`);
    process.exit(2);
  }
  return exercise;
}

function run(label, command, args, cwd = repoRoot) {
  console.log(`\n--- ${label}\n`);
  // npm/npx are .cmd shims on Windows and need a shell. The args are fixed (no user input).
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.error) console.error(`Could not run ${command}: ${result.error.message}`);
  return { label, ok: result.status === 0 };
}

function runChecks(exercise) {
  const results = [];
  results.push(run('build contracts', 'npm', ['run', 'build:contracts']));
  if (!results[0].ok) return results;
  return [...results, ...exerciseChecks(exercise)];
}

/** Core spec files whose content matches `pattern`, each printed with `message`. */
function coreSpecsMatching(pattern, message) {
  const matches = CORE_SPECS.filter((file) => {
    const path = join(repoRoot, file);
    return existsSync(path) && pattern.test(readFileSync(path, 'utf8'));
  });
  for (const file of matches) console.log(`${message} ${file}`);
  return matches;
}

function exerciseCheck(exercise) {
  const checkFile = `test/steps/exercise-${exercise.toLowerCase()}.check.ts`;
  return run(
    `exercise ${exercise} checks (${checkFile})`,
    'npx',
    ['vitest', 'run', '--config', 'vitest.steps.config.ts', checkFile],
    apiDir,
  );
}

function exerciseChecks(exercise) {
  const results = [exerciseCheck(exercise)];
  if (exercise === 'A') {
    results.push(run('no key in the web bundle (check:bundle)', 'npm', ['run', 'check:bundle']));
  }
  if (exercise === 'D') {
    const todos = coreSpecsMatching(TODO_PATTERN, 'it.todo left in');
    results.push({ label: 'no it.todo left in the core D specs', ok: todos.length === 0 });
    const skipped = coreSpecsMatching(SKIP_PATTERN, '.skip/.only found in');
    results.push({ label: 'no .skip/.only in the core D specs', ok: skipped.length === 0 });
    results.push(run('npm test (offline)', 'npm', ['test']));
  }
  return results;
}

function runAllChecks() {
  const results = [run('build contracts', 'npm', ['run', 'build:contracts'])];
  if (!results[0].ok) return results;
  for (const exercise of ['A', 'B', 'C', 'D']) {
    for (const result of exerciseChecks(exercise)) {
      results.push({ ...result, label: `${exercise}: ${result.label}` });
    }
  }
  return results;
}

const exercise = pickExercise();
if (exercise === 'done') {
  const results = runAllChecks();
  const passed = results.every((result) => result.ok);
  console.log('\n=== All exercises (A-D) summary ===');
  for (const { label, ok } of results) console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  console.log(
    passed
      ? '\nAll exercises are done. Nice work! Closing notes: CHECKLIST.md (production checklist),\n' +
          'docs/before-after.md (step-1 -> main) and EXTRAS.md (extra tests and challenges).'
      : '\nSomething regressed: run the failing check above for details.',
  );
  process.exit(passed ? 0 : 1);
}

const results = runChecks(exercise);
const passed = results.every((result) => result.ok);

console.log(`\n=== Exercise ${exercise} summary ===`);
for (const { label, ok } of results) console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
console.log(
  passed
    ? `\nDone! Move on: git checkout ${NEXT_BRANCH[exercise]}`
    : '\nNot yet: see STEP.md (or run the failing check above for details).',
);
process.exit(passed ? 0 : 1);
