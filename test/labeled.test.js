// Runs the checker over the labeled set and writes evidence/labeled-report.md with caught/missed per problem type.
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import test from 'node:test';
import { check } from '../engine.js';
import { CONTROLS, REPORTED, DOCUMENTED, EXPORTS } from './labeled-set.js';

const run = c => check(c.workflow(), c.listing || '', { version: c.version });
const results = [];

for (const c of CONTROLS) {
  test(`control has no false alarm: ${c.name}`, () => {
    const r = run(c);
    assert.ok(r.ok, r.message);
    const alarms = r.findings.filter(f => ['fail', 'warn', 'dormant'].includes(f.status));
    assert.deepEqual(alarms.map(f => `${f.id}: ${f.title}`), []);
    assert.ok(r.passes.length >= 2);
    results.push({ kind: 'control', name: c.name, format: r.format, alarms: alarms.length, info: r.findings.filter(f => f.status === 'info').map(f => f.id), passes: r.passes.length });
  });
}

for (const c of REPORTED) {
  test(`reported ${c.id} ${c.config}`, () => {
    const r = run(c);
    assert.ok(r.ok, r.message);
    const hit = c.expect ? r.findings.find(f => f.id === c.expect) : null;
    if (c.expect) assert.ok(hit, `${c.id} expected ${c.expect}; got ${r.findings.map(f => f.id).join(', ')}`);
    else assert.equal(r.findings.filter(f => ['fail', 'warn'].includes(f.status)).length, 0, `${c.id} is a clean workflow`);
    results.push({ kind: 'reported', ...c, caught: !!hit, status: hit?.status, title: hit?.title });
  });
}

for (const c of DOCUMENTED) {
  test(`documented ${c.id} ${c.config}`, () => {
    const r = run(c);
    const hit = r.findings.find(f => f.id === c.expect);
    assert.ok(hit, `${c.id} expected ${c.expect}; got ${r.findings.map(f => f.id).join(', ')}`);
    assert.equal(hit.status, c.status);
    results.push({ kind: 'documented', ...c, caught: true, title: hit.title });
  });
}

const key = r => r.findings.map(f => `${f.id}:${f.status}`).sort();
for (const c of EXPORTS) {
  test(`real export ${c.id} ${c.config}`, () => {
    const r = run(c);
    assert.ok(r.ok, r.message);
    const hit = r.findings.find(f => f.id === c.expect);
    assert.ok(hit, `${c.id} expected ${c.expect}; got ${r.findings.map(f => f.id).join(', ')}`);
    assert.equal(hit.status, c.status);
    if (c.sameAs) assert.deepEqual(key(r), key(check(c.sameAs(), '')), `${c.id} reads differently from its template file`);
    results.push({ kind: 'export', ...c, format: r.format, title: hit.title, same: c.sameAs ? 'yes' : '–' });
  });
}

// The fixed upstream templates must not trip either system-prompt rule, with the PE off or switched on.
test('the upstream-fixed templates raise no system-prompt finding', () => {
  const fixed = CONTROLS.filter(c => c.upstreamFix);
  assert.equal(fixed.length, 4);
  for (const c of fixed) assert.deepEqual(run(c).findings.filter(f => /^pe\.(no-system|system-dropped|double-wrap|leading-space)$/.test(f.id)), [], c.name);
});

// Measured: Text to Image at 4,096 never reached the cap (n=2). Image Edit is unmeasured, so its budget is a note that says so.
test('max_length below Qwen\'s figure warns only below the measured 4,096', () => {
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
});

// Live readback on ComfyUI 0.38.0: the official Image Edit node has use_default_template off, so connecting the prompt alone still drops it.
test('the Image Edit fix names both steps, and no rule blames the missing prompt for runaway thinking', () => {
  const edit = check(DOCUMENTED.find(c => c.id === 'D2').workflow(), '').findings.find(f => f.id === 'pe.no-system');
  assert.match(edit.fix, /turn use_default_template on\. It is off here, and connecting the prompt alone still drops it/);
  for (const c of [...CONTROLS, ...REPORTED, ...DOCUMENTED, ...EXPORTS]) {
    for (const f of run(c).findings || []) assert.doesNotMatch(`${f.detail} ${f.fix}`, /runs? out of tokens/, `${c.id || c.name} ${f.id}`);
  }
});

const esc = s => String(s).replace(/\|/g, '\\|');
test.after(() => {
  const rep = results.filter(r => r.kind === 'reported');
  const types = ['files', 'nodes', 'pe', 'vram', 'outside'];
  const per = types.map(t => { const xs = rep.filter(r => r.type === t); return [t, xs.filter(r => r.caught).length, xs.length]; });
  const caught = rep.filter(r => r.caught).length;
  const lines = [
    '# Labeled set: caught and missed', '',
    `Generated by \`npm test\` on ${new Date().toISOString().slice(0, 10)}. Every reported case is an edit of an official Comfy-Org template (fixtures/official).`, '',
    `**Reported problems caught: ${caught} of ${rep.length} (${Math.round(100 * caught / rep.length)}%).** Stop rule: stop below 50%.`, '',
    '| Problem type | Caught | Of |', '|---|---|---|', ...per.map(([t, a, b]) => `| ${t} | ${a} | ${b} |`), '',
    '## Controls (must raise no fail, warning or dormant finding)', '',
    '| Control | Format | Alarms | Info notes | Passes |', '|---|---|---|---|---|',
    ...results.filter(r => r.kind === 'control').map(r => `| ${r.name} | ${r.format} | ${r.alarms} | ${r.info.join(', ') || '–'} | ${r.passes} |`), '',
    '## Real ComfyUI 0.38.0 exports (templates package 0.11.70)', '',
    '| ID | Export | Format | Expected rule | Result | Reads like its template file |', '|---|---|---|---|---|---|',
    ...results.filter(r => r.kind === 'export').map(r => `| ${r.id} | ${esc(r.config)} | ${r.format} | ${r.expect} | ${r.status} | ${r.same} |`), '',
    '## Reported cases', '',
    '| ID | Type | Thread | Rebuilt configuration | Expected rule | Result | ComfyUI today |', '|---|---|---|---|---|---|---|',
    ...rep.map(r => `| ${r.id} | ${r.type} | ${r.thread} | ${r.config}${r.assumption ? ` (${r.assumption})` : ''}${r.version ? `; version ${r.version}` : ''} | ${r.expect || '–'} | ${r.caught ? `caught (${r.status})` : 'missed'} | ${r.flaggedToday} |`), '',
    '## Documented rules (source code or Qwen docs; not counted above)', '',
    '| ID | Configuration | Rule | Status |', '|---|---|---|---|',
    ...results.filter(r => r.kind === 'documented').map(r => `| ${r.id} | ${esc(r.config)} | ${r.expect} | ${r.status} |`), '',
  ];
  mkdirSync(new URL('../evidence/', import.meta.url), { recursive: true });
  writeFileSync(new URL('../evidence/labeled-report.md', import.meta.url), lines.join('\n'));
});
