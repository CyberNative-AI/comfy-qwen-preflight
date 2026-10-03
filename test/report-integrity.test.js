// Regression checks for evidence preservation and complete scratch-only generation.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, existsSync, readdirSync, rmSync, symlinkSync, linkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { CASES } from '../tools/labeled-evaluate.mjs';
import { generateReport } from '../tools/labeled-report.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const historical = join(root, 'evidence/labeled-report.md');
const accepted = readFileSync(historical);
const evaluator = new URL('../tools/labeled-evaluate.mjs', import.meta.url).href;
const exporter = join(root, 'tools/labeled-report.mjs');
const sentinel = Buffer.from('existing scratch evidence\n');
const scratch = t => {
  const dir = mkdtempSync(join(tmpdir(), 'labeled-integrity-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
};
const changed = (id, change) => CASES.map(entry => entry.c.id === id || entry.c.name === id
  ? { ...entry, c: { ...entry.c, ...change } } : entry);
const clean = CASES.find(x => x.kind === 'control').c.workflow;
const broken = CASES.find(x => x.c.id === 'R1').c.workflow;

function rejectsWithoutMutation(t, cases, message) {
  const dir = scratch(t);
  for (const existing of [false, true]) {
    const output = join(dir, existing ? 'sentinel.md' : 'absent.md');
    if (existing) writeFileSync(output, sentinel);
    const files = readdirSync(dir);
    assert.throws(() => generateReport(output, cases), message);
    if (existing) assert.deepEqual(readFileSync(output), sentinel);
    else assert.equal(existsSync(output), false);
    assert.deepEqual(readdirSync(dir), files, 'no partial or temporary files left behind');
    assert.deepEqual(readFileSync(historical), accepted);
  }
}

for (const kind of ['reported', 'control', 'export', 'documented']) {
  test(`missing ${kind} identity rejects absent and existing output`, t => {
    const omitted = CASES.find(x => x.kind === kind);
    rejectsWithoutMutation(t, CASES.filter(x => x !== omitted), /missing identity/);
  });
}
test('duplicate identity with unchanged category counts rejects both outputs', t => {
  const cases = [...CASES];
  cases[1] = cases[0];
  rejectsWithoutMutation(t, cases, /duplicate identity/);
});
test('unknown identity with unchanged totals rejects both outputs', t => {
  rejectsWithoutMutation(t, changed('R1', { id: 'unexpected' }), /unknown identity/);
});
test('wrong category with unchanged total rejects both outputs', t => {
  const cases = CASES.map(x => x.c.id === 'R1' ? { ...x, kind: 'documented' } : x);
  rejectsWithoutMutation(t, cases, /unknown identity/);
});

for (const [name, id, change, error] of [
  ['reported expected finding', 'R1', { workflow: clean }, /R1 expected files.pe-in-encoder/],
  ['legitimate miss clean-workflow assertion', 'M2', { workflow: broken }, /M2 is a clean workflow/],
  ['control false alarm', CASES[0].c.name, { workflow: broken }, /deep-equal/],
  ['documented expected finding', 'D1', { workflow: clean }, /D1 expected pe.system-dropped/],
  ['documented status', 'D1', { status: 'fail' }, /strictly equal/],
  ['export expected finding', 'E1', { workflow: clean }, /E1 expected pe.system-dropped/],
  ['export status', 'E1', { status: 'fail' }, /strictly equal/],
  ['export parity', 'E1', { sameAs: clean }, /E1 reads differently/],
]) {
  test(`${name} failure rejects absent and existing output`, t => {
    rejectsWithoutMutation(t, changed(id, change), error);
  });
}
test('cross-case invariant failure rejects both outputs', t => {
  const fixed = CASES.find(x => x.c.upstreamFix);
  const original = fixed.c.upstreamFix;
  try {
    fixed.c.upstreamFix = false;
    rejectsWithoutMutation(t, CASES, /strictly equal/);
  } finally { fixed.c.upstreamFix = original; }
});

test('complete generation reconciles every identity, controls, parity and 12/17 meaning', t => {
  const dir = scratch(t), output = join(dir, 'complete.md');
  writeFileSync(output, sentinel);
  const rows = generateReport(output);
  assert.equal(rows.length, 44);
  for (const kind of ['reported', 'control', 'export', 'documented']) {
    const id = c => c.id || c.name;
    assert.deepEqual(rows.filter(x => x.kind === kind).map(id), CASES.filter(x => x.kind === kind).map(x => id(x.c)));
  }
  assert.equal(rows.filter(x => x.kind === 'reported' && x.caught).length, 12);
  assert.deepEqual(rows.filter(x => x.kind === 'reported' && !x.caught).map(x => x.id), ['M1', 'M2', 'M3', 'M4', 'M5']);
  assert.equal(rows.filter(x => x.kind === 'control' && x.alarms === 0).length, 13);
  assert.deepEqual(rows.filter(x => x.kind === 'export' && x.same === 'yes').map(x => x.id), ['E1', 'E2']);
  const body = readFileSync(output, 'utf8');
  assert.match(body, /Reported problems caught: 12 of 17/);
  for (const { kind, c } of CASES) {
    assert.ok(body.includes(`| ${kind === 'control' ? c.name : c.id} |`), `report omitted ${c.id || c.name}`);
  }
  assert.deepEqual(readFileSync(historical), accepted);
  assert.deepEqual(readdirSync(dir), ['complete.md']);
});

test('explicit CLI requires scratch output and emits a complete candidate', t => {
  const dir = scratch(t), output = join(dir, 'cli.md');
  for (const args of [[], ['--output'], ['--output', output, '--partial']]) {
    const run = spawnSync(process.execPath, [exporter, ...args], { cwd: root, encoding: 'utf8' });
    assert.equal(run.status, 1, run.stderr);
    assert.equal(existsSync(output), false);
  }
  const run = spawnSync(process.execPath, [exporter, '--output', output], { cwd: root, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /44 rows/);
  assert.match(readFileSync(output, 'utf8'), /Reported problems caught: 12 of 17/);
});

test('repository paths and external aliases cannot target accepted evidence', t => {
  const dir = scratch(t);
  const absent = join(dirname(historical), 'invalid-output.md');
  assert.equal(existsSync(absent), false);
  for (const output of [historical, absent]) assert.throws(() => generateReport(output), /outside the repository/);
  assert.equal(existsSync(absent), false);
  for (const type of ['symlink', 'hardlink']) {
    const output = join(dir, `${type}.md`);
    if (type === 'symlink') symlinkSync(historical, output);
    else linkSync(historical, output);
    assert.throws(() => generateReport(output), /symbolic link|aliases accepted/);
    assert.deepEqual(readFileSync(output), accepted);
  }
  const alias = join(dir, 'repository');
  symlinkSync(root, alias);
  assert.throws(() => generateReport(join(alias, 'evidence/labeled-report.md')), /outside the repository/);
  assert.deepEqual(readFileSync(historical), accepted);
});

test('focused ordinary tests and a deliberate failing assertion preserve accepted evidence', t => {
  const childEnv = { ...process.env };
  delete childEnv.NODE_TEST_CONTEXT; // Nested test runners otherwise skip their files.
  const focused = spawnSync(process.execPath, ['--test', '--test-name-pattern=reported R1 ', 'test/labeled.test.js'], { cwd: root, env: childEnv, encoding: 'utf8' });
  assert.equal(focused.status, 0, focused.stdout + focused.stderr);
  assert.deepEqual(readFileSync(historical), accepted);
  // Use the actual ordinary test registrations with one independently invalid expectation.
  const file = join(scratch(t), 'deliberate.test.mjs');
  const ordinary = readFileSync(join(root, 'test/labeled.test.js'), 'utf8')
    .replace("'../tools/labeled-evaluate.mjs'", JSON.stringify(evaluator))
    .replace('for (const entry of CASES)', "CASES.find(x => x.c.id === 'R1').c = { ...CASES.find(x => x.c.id === 'R1').c, expect: 'deliberately-missing-rule' };\nfor (const entry of CASES)");
  writeFileSync(file, ordinary);
  const failed = spawnSync(process.execPath, ['--test', '--test-name-pattern=reported R1 ', file], { cwd: root, env: childEnv, encoding: 'utf8' });
  assert.equal(failed.status, 1, failed.stdout + failed.stderr);
  assert.match(failed.stdout + failed.stderr, /R1 expected deliberately-missing-rule/);
  assert.deepEqual(readFileSync(historical), accepted);
});

test.after(() => assert.deepEqual(readFileSync(historical), accepted));
