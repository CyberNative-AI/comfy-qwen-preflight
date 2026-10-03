// Ordinary tests never rewrite the accepted evidence report.
import test from 'node:test';
import { CASES, INVARIANTS, evaluateCase } from '../tools/labeled-evaluate.mjs';

for (const entry of CASES) {
  const { kind, c } = entry;
  const name = kind === 'control' ? `control has no false alarm: ${c.name}`
    : `${kind === 'export' ? 'real export' : kind} ${c.id} ${c.config}`;
  test(name, () => evaluateCase(entry));
}
for (const { name, validate } of INVARIANTS) test(name, validate);
