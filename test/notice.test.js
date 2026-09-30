// The redistributed Comfy-Org templates keep their MIT notice in every copy we serve or ship.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const license = read('fixtures/official/LICENSE.txt').trimEnd();

test('the MIT notice is the upstream text', () => {
  assert.match(license, /^MIT License\n\nCopyright \(c\) 2023-present Comfy Org\n/);
  assert.match(license, /shall be included in all\ncopies or substantial portions of the Software\./);
});

test('example.js carries the notice verbatim', () => {
  assert.ok(read('example.js').includes(`/*\n${license}\n*/`));
});

test('footer and README point to the notice', () => {
  assert.match(read('index.html'), /<footer[\s\S]*href="fixtures\/official\/LICENSE\.txt"/);
  assert.match(read('README.md'), /\(fixtures\/official\/LICENSE\.txt\)/);
});
