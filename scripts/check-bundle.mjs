#!/usr/bin/env node
// Scans the built web bundle (apps/web/dist) for strings that look like API keys.
//
//   node scripts/check-bundle.mjs                 exit 0 clean, 1 leak found, 2 no build output
//   node scripts/check-bundle.mjs --expect-step   CI mode: reads workshop.json; on step 1 the
//                                                 leak is planted on purpose, so a leak is
//                                                 expected (exit 0) and its absence fails (exit 1).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const distDir = join(repoRoot, 'apps', 'web', 'dist');
const textExtensions = new Set(['.js', '.mjs', '.css', '.html', '.json', '.map', '.txt']);

const patterns = [
  { name: 'Google API key', regex: /AIza[0-9A-Za-z_-]{35}/g },
  { name: 'OpenAI API key', regex: /sk-[A-Za-z0-9_-]{20,}/g },
  { name: 'Workshop demo key', regex: /wsk_demo_[A-Za-z0-9]{8,}/g },
];

function listFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

function mask(value) {
  return `${value.slice(0, 8)}${'*'.repeat(Math.max(0, value.length - 8))}`;
}

function scan() {
  const findings = [];
  for (const file of listFiles(distDir)) {
    const dot = file.lastIndexOf('.');
    if (dot === -1 || !textExtensions.has(file.slice(dot))) continue;
    const content = readFileSync(file, 'utf8');
    for (const { name, regex } of patterns) {
      for (const match of content.matchAll(regex)) {
        findings.push({ file: relative(repoRoot, file), name, value: match[0] });
      }
    }
  }
  return findings;
}

function readStep() {
  const workshop = JSON.parse(readFileSync(join(repoRoot, 'workshop.json'), 'utf8'));
  return typeof workshop.step === 'number' ? workshop.step : undefined;
}

if (!existsSync(distDir) || listFiles(distDir).length === 0) {
  console.error('No web build output found in apps/web/dist.');
  console.error('Run `npm run build` (or `npm run check:bundle`) first.');
  process.exit(2);
}

const findings = scan();
for (const { file, name, value } of findings) {
  console.log(`${file}: ${name} ${mask(value)}`);
}

const expectStep = process.argv.includes('--expect-step');
if (expectStep && readStep() === 1) {
  if (findings.length > 0) {
    console.log('expected leak on step 1 (Exercise A fixes it)');
    process.exit(0);
  }
  console.error('step 1 should ship the planted key leak, but none was found in the bundle.');
  process.exit(1);
}

if (findings.length > 0) {
  console.error(`Found ${String(findings.length)} key-like string(s) in the web bundle.`);
  console.error('API keys belong on the server. Move the provider call to the API.');
  process.exit(1);
}

console.log('No key-like strings found in the web bundle.');
