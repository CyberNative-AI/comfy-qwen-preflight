// Shared acceptance checks for ordinary tests and explicit complete-set reporting.
import assert from 'node:assert/strict';
import { check } from '../engine.js';
import { CONTROLS, REPORTED, DOCUMENTED, EXPORTS } from '../test/labeled-set.js';

const run = c => check(c.workflow(), c.listing || '', { version: c.version });
const key = r => r.findings.map(f => `${f.id}:${f.status}`).sort();
export const CASES = Object.entries({ control: CONTROLS, reported: REPORTED, documented: DOCUMENTED, export: EXPORTS })
  .flatMap(([kind, cases]) => cases.map(c => ({ kind, c })));
const identity = ({ kind, c }) => `${kind}:${c.id || c.name}`;

// Both counts and identities must match the declared corpus; equal totals alone are insufficient.
export function validateCompleteSet(cases) {
  const counts = { control: 13, reported: 17, documented: 10, export: 4 };
  for (const [kind, count] of Object.entries(counts)) {
    assert.equal(CASES.filter(x => x.kind === kind).length, count, `declared ${kind} count changed; review the corpus`);
  }
  const declared = new Set(CASES.map(identity));
  assert.equal(declared.size, CASES.length, 'duplicate declared identity');
  const seen = new Set();
  for (const entry of cases) {
    const id = identity(entry);
    assert.ok(declared.has(id), `unknown identity ${id}`);
    assert.ok(!seen.has(id), `duplicate identity ${id}`);
    seen.add(id);
  }
  for (const id of declared) assert.ok(seen.has(id), `missing identity ${id}`);
}

export function evaluateCase({ kind, c }) {
  if (kind === 'control') {
    const r = run(c);
    assert.ok(r.ok, r.message);
    const alarms = r.findings.filter(f => ['fail', 'warn', 'dormant'].includes(f.status));
    assert.deepEqual(alarms.map(f => `${f.id}: ${f.title}`), []);
    assert.ok(r.passes.length >= 2);
    return { kind: 'control', name: c.name, format: r.format, alarms: alarms.length, info: r.findings.filter(f => f.status === 'info').map(f => f.id), passes: r.passes.length };
  }
  if (kind === 'reported') {
    const r = run(c);
    assert.ok(r.ok, r.message);
    const hit = c.expect ? r.findings.find(f => f.id === c.expect) : null;
    if (c.expect) assert.ok(hit, `${c.id} expected ${c.expect}; got ${r.findings.map(f => f.id).join(', ')}`);
    else assert.equal(r.findings.filter(f => ['fail', 'warn'].includes(f.status)).length, 0, `${c.id} is a clean workflow`);
    return { kind: 'reported', ...c, caught: !!hit, status: hit?.status, title: hit?.title };
  }
  if (kind === 'documented') {
    const r = run(c);
    const hit = r.findings.find(f => f.id === c.expect);
    assert.ok(hit, `${c.id} expected ${c.expect}; got ${r.findings.map(f => f.id).join(', ')}`);
    assert.equal(hit.status, c.status);
    return { kind: 'documented', ...c, caught: true, title: hit.title };
  }
  if (kind === 'export') {
    const r = run(c);
    assert.ok(r.ok, r.message);
    const hit = r.findings.find(f => f.id === c.expect);
    assert.ok(hit, `${c.id} expected ${c.expect}; got ${r.findings.map(f => f.id).join(', ')}`);
    assert.equal(hit.status, c.status);
    if (c.sameAs) assert.deepEqual(key(r), key(check(c.sameAs(), '')), `${c.id} reads differently from its template file`);
    return { kind: 'export', ...c, format: r.format, title: hit.title, same: c.sameAs ? 'yes' : '–' };
  }
  throw new Error(`unknown category ${kind}`);
}

export const INVARIANTS = [
// The fixed upstream templates must not trip either system-prompt rule, with the PE off or switched on.
{ name: 'the upstream-fixed templates raise no system-prompt finding', validate: () => {
  const fixed = CONTROLS.filter(c => c.upstreamFix);
  assert.equal(fixed.length, 4);
  for (const c of fixed) assert.deepEqual(run(c).findings.filter(f => /^pe\.(no-system|system-dropped|double-wrap|leading-space)$/.test(f.id)), [], c.name);
} },

// Measured: Text to Image at 4,096 never reached the cap (n=2). Image Edit is unmeasured, so its budget is a note that says so.
{ name: 'max_length below Qwen\'s figure warns only below the measured 4,096', validate: () => {
  const at = (wf, id, n) => { const w = JSON.parse(wf); w.definitions.subgraphs[0].nodes.find(x => x.id === id).widgets_values[1] = n; return JSON.stringify(w); };
  const mt = text => check(text, '').findings.find(f => f.id === 'pe.max-tokens');
  const t2i = CONTROLS[0].workflow(), edit = CONTROLS[1].workflow();
  assert.equal(mt(at(t2i, 471, 4096)).status, 'info');
  assert.match(mt(at(t2i, 471, 4096)).detail, /no run reached the cap/);
  assert.equal(mt(at(t2i, 471, 2048)).status, 'warn');
  assert.equal(mt(at(edit, 500, 16256)).status, 'info');
  assert.match(mt(at(edit, 500, 16256)).detail, /^Not measured here/);
  assert.equal(mt(at(edit, 500, 512)).status, 'warn');
  for (const c of [...CONTROLS, ...REPORTED, ...DOCUMENTED, ...EXPORTS]) {
    for (const f of run(c).findings || []) if (f.id === 'pe.max-tokens' && f.status === 'info') assert.doesNotMatch(f.detail, /thinking block|stops early|cut/, c.id || c.name);
  }
} },

// Live readback on ComfyUI 0.38.0: the official Image Edit node has use_default_template off, so connecting the prompt alone still drops it.
{ name: 'the Image Edit fix names both steps, and no rule blames the missing prompt for runaway thinking', validate: () => {
  const edit = check(DOCUMENTED.find(c => c.id === 'D2').workflow(), '').findings.find(f => f.id === 'pe.no-system');
  assert.match(edit.fix, /turn use_default_template on\. It is off here, and connecting the prompt alone still drops it/);
  for (const c of [...CONTROLS, ...REPORTED, ...DOCUMENTED, ...EXPORTS]) {
    for (const f of run(c).findings || []) assert.doesNotMatch(`${f.detail} ${f.fix}`, /runs? out of tokens/, `${c.id || c.name} ${f.id}`);
  }
} },

];

export function evaluateAll(cases = CASES) {
  validateCompleteSet(cases);
  const rows = cases.map(evaluateCase);
  for (const { validate } of INVARIANTS) validate();
  validateCompleteSet(rows.map(row => ({ kind: row.kind, c: row })));
  return rows;
}
