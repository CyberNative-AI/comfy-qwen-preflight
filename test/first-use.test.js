import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { check } from '../engine.js';

const read = name => readFileSync(new URL(`../fixtures/first-use/${name}`, import.meta.url), 'utf8');

test('published sample expectations match the engine and isolate the two-setting repair', () => {
  for (const name of ['broken', 'corrected']) {
    const result = check(read(`${name}.api.json`), '', { version: '0.38.0' });
    assert.deepEqual(result, JSON.parse(read(`${name}.expected.json`)));
    assert.equal(result.summary.fail, name === 'broken' ? 1 : 0);
    assert.equal(result.summary.warn, 0);
    assert.equal(result.summary.dormant, 0);
    assert.equal(result.nodeCount, 20);
  }
  const broken = JSON.parse(read('broken.api.json'));
  const corrected = JSON.parse(read('corrected.api.json'));
  broken['459:500'].inputs.system_prompt = ['459:479', 0];
  broken['459:500'].inputs.use_default_template = true;
  assert.deepEqual(broken, corrected, 'nothing else changes between the fixtures');
  corrected['459:500'].inputs.use_default_template = false;
  const partial = check(JSON.stringify(corrected), '', { version: '0.38.0' });
  assert.ok(partial.findings.some(f => f.id === 'pe.system-dropped' && f.status === 'fail'), 'connecting the prompt alone is not a repair');
});
