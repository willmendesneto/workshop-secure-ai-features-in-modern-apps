#!/usr/bin/env node
// Checks whether the current exercise is done.
//
//   npm run check:step                          exercise from workshop.json (1->A, 2->B, 3->C, 4->D)
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
const TODO_SPECS = ['auth', 'tenant', 'schema', 'limits', 'logs'].map((name) =>
  join('apps', 'api', 'test', `${name}.spec.ts`),
);

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

  if (exercise === 'D') {
    const leftovers = TODO_SPECS.filter((file) => {
      const path = join(repoRoot, file);
      return existsSync(path) && /\bit\.todo\s*\(/.test(readFileSync(path, 'utf8'));
    });
    for (const file of leftovers) console.log(`it.todo left in ${file}`);
    results.push({ label: 'no it.todo left in the negative specs', ok: leftovers.length === 0 });
    results.push(run('npm test (offline)', 'npm', ['test']));
    return results;
  }

  const checkFile = `test/steps/exercise-${exercise.toLowerCase()}.check.ts`;
  results.push(
    run(
      `exercise ${exercise} checks (${checkFile})`,
      'npx',
      ['vitest', 'run', '--config', 'vitest.steps.config.ts', checkFile],
      apiDir,
    ),
  );
  if (exercise === 'A') {
    results.push(run('no key in the web bundle (check:bundle)', 'npm', ['run', 'check:bundle']));
  }
  return results;
}

const exercise = pickExercise();
if (exercise === 'done') {
  console.log('All exercises are done. Nice work! See README.md for the closing notes.');
  process.exit(0);
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
