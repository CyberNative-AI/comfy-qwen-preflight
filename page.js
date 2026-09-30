import { check, SOURCES, BUDGETS, gib } from './engine.js';

const byId = id => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const STATUS = { fail: 'Fix', dormant: 'When on', warn: 'Check', info: 'Note', pass: 'Fine', absent: 'Not used', missing: 'Missing' };
// File names wrap at their own separators, not mid-word.
const breakable = (cls, text) => { const e = el('code', cls); String(text).split(/(?<=[_.\-\/])/).forEach((part, i) => { if (i) e.append(document.createElement('wbr')); e.append(part); }); return e; };
const MAX_BYTES = 20 * 1024 * 1024;

const form = byId('form');
const workflow = byId('workflow');
const formError = byId('form-error');
const fileStatus = byId('file-status');

function showError(msg) { formError.textContent = msg; formError.hidden = false; }
function clearError() { formError.hidden = true; formError.textContent = ''; }

function readFile(file) {
  clearError();
  if (!file) return;
  if (file.size > MAX_BYTES) { showError(`${file.name} is ${(file.size / 1048576).toFixed(1)} MB. A workflow is usually under 1 MB; is this the right file?`); return; }
  const reader = new FileReader();
  reader.onload = () => { workflow.value = String(reader.result); fileStatus.textContent = `Loaded ${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB) into this page.`; run(); };
  reader.onerror = () => showError(`Could not read ${file.name}.`);
  reader.readAsText(file);
}

byId('file').addEventListener('change', e => readFile(e.target.files[0]));
const drop = byId('drop');
for (const ev of ['dragenter', 'dragover']) drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); });
for (const ev of ['dragleave', 'drop']) drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); });
drop.addEventListener('drop', e => readFile(e.dataTransfer.files[0]));
// A file dropped anywhere else would navigate away from the page; keep it here.
window.addEventListener('dragover', e => e.preventDefault());
window.addEventListener('drop', e => { if (!drop.contains(e.target)) { e.preventDefault(); readFile(e.dataTransfer?.files?.[0]); } });

byId('example').addEventListener('click', async () => {
  const { OFFICIAL_IMAGE_EDIT } = await import('./example.js');
  workflow.value = OFFICIAL_IMAGE_EDIT;
  fileStatus.textContent = 'Loaded the official Image Edit template as templates package 0.11.70 wires it.';
  run();
});

form.addEventListener('submit', e => { e.preventDefault(); run(); });

function run() {
  clearError();
  const text = workflow.value.trim();
  if (!text) { showError('Drop, choose or paste a workflow first.'); workflow.focus(); return; }
  const r = check(text, byId('listing').value, { version: byId('version').value.trim() });
  render(r);
}

function sourcesDetails(keys) {
  const list = [...new Set(keys)].map(k => SOURCES[k]).filter(Boolean);
  if (!list.length) return null;
  const d = el('details', 'src');
  d.append(el('summary', null, list.length === 1 ? 'Source' : `Sources (${list.length})`));
  const ul = el('ul');
  for (const s of list) { const li = el('li'); const a = el('a', null, s.label); a.href = s.url; a.rel = 'noopener noreferrer'; a.target = '_blank'; li.append(a); ul.append(li); }
  d.append(ul);
  return d;
}

function findingItem(f) {
  const li = el('li', `fix ${f.status}`);
  const head = el('div', 'fix-head');
  head.append(el('span', `status ${f.status}`, STATUS[f.status]), el('span', 'fix-title', f.title));
  li.append(head);
  if (f.node) li.append(el('p', 'where', f.node));
  if (f.detail) li.append(el('p', 'fix-detail', f.detail));
  if (f.fix) { const p = el('p', 'fix-do'); p.append(el('span', 'label', 'Fix'), document.createTextNode(' ' + f.fix)); li.append(p); }
  const s = sourcesDetails(f.sources || []); if (s) li.append(s);
  return li;
}

function render(r) {
  const verdict = byId('verdict');
  const parts = ['slots', 'fixes-wrap', 'vram-wrap', 'notes-wrap', 'passes-wrap'].map(byId);
  for (const p of parts) p.hidden = true;
  for (const id of ['slots', 'fixes', 'vram', 'notes', 'passes']) byId(id).replaceChildren();
  verdict.className = 'verdict';

  if (!r.ok) { verdict.classList.add('empty', 'bad'); verdict.textContent = r.message; focusResult(); return; }
  if (r.notQwen) {
    verdict.classList.add('empty');
    verdict.textContent = `This workflow (${r.nodeCount} nodes) has no Qwen-Image 2.1 files or nodes, so there is nothing to check. This page only knows the Qwen-Image 2.1 pipeline.`;
    focusResult(); return;
  }

  const { fail, dormant, warn } = r.summary;
  const n = (k, one, many) => `${k} ${k === 1 ? one : many}`;
  if (fail) verdict.textContent = `${n(fail, 'thing', 'things')} to fix before you run this.`;
  else if (dormant) verdict.textContent = `Nothing to fix now. ${n(dormant, 'problem waits', 'problems wait')} in a switched-off branch.`;
  else if (warn) verdict.textContent = `Nothing broken. ${n(warn, 'thing', 'things')} to check.`;
  else verdict.textContent = 'Nothing to fix in what this page can check.';
  const bits = [`${r.format === 'api' ? 'API' : 'UI'}-format workflow`, `${r.nodeCount} nodes`];
  if (r.subgraphs) bits.push(n(r.subgraphs, 'subgraph', 'subgraphs'));
  if (r.version) bits.push(`ComfyUI ${r.version}`);
  if (fail && dormant) bits.push(`${dormant} more when switched on`);
  if ((fail || dormant) && warn) bits.push(`${warn} to check`);
  const of = el('span', 'of', bits.join(' · '));
  verdict.append(of);

  // Slots
  const slots = byId('slots');
  r.slots.forEach((s, i) => {
    const li = el('li', `slot ${s.status}`);
    li.append(el('span', 'num', String(i + 1)));
    const body = el('span', 'slot-body');
    const top = el('span', 'slot-top');
    top.append(el('b', null, s.label), el('span', `status ${s.status}`, STATUS[s.status]));
    body.append(top);
    if (s.files.length) for (const f of s.files) { body.append(breakable('slot-file', f.name)); body.append(el('span', 'slot-node', f.node)); }
    else body.append(el('span', 'slot-node', s.optional ? 'Not in this workflow' : 'No loader found'));
    li.append(body);
    slots.append(li);
  });
  slots.hidden = false;

  const alarms = r.findings.filter(f => ['fail', 'dormant', 'warn'].includes(f.status));
  const notes = r.findings.filter(f => f.status === 'info');
  if (alarms.length) { for (const f of alarms) byId('fixes').append(findingItem(f)); byId('fixes-wrap').hidden = false; }
  if (notes.length) { for (const f of notes) byId('notes').append(findingItem(f)); byId('notes-wrap').hidden = false; }

  renderVram(r.vram);

  if (r.passes.length) {
    for (const p of r.passes) { const li = el('li'); li.append(el('span', 'status pass', 'Fine'), el('span', null, ' ' + p.title)); byId('passes').append(li); }
    byId('passes-wrap').hidden = false;
  }
  focusResult();
}

function renderVram(v) {
  if (!v || !v.stages.length) return;
  const wrap = byId('vram');
  const known = v.stages.filter(s => s.gib != null);
  const table = el('table');
  const cap = el('caption', null, 'Model weights per stage against three VRAM sizes. Sizes are the published file sizes.');
  table.append(cap);
  const thead = el('thead'); const hr = el('tr');
  hr.append(el('th', null, 'Weights'));
  for (const b of BUDGETS) { const th = el('th', 'num-col', `${b} GB`); th.scope = 'col'; hr.append(th); }
  thead.append(hr); table.append(thead);
  const tbody = el('tbody');
  const row = (label, sub, gibVal) => {
    const tr = el('tr');
    const th = el('th'); th.scope = 'row';
    th.append(el('span', 'v-label', label));
    if (sub) th.append(breakable('v-file', sub));
    th.append(el('span', 'v-sub', gibVal != null ? `${gibVal.toFixed(1)} GB` : 'size unknown'));
    tr.append(th);
    for (const b of BUDGETS) {
      const td = el('td', 'num-col');
      if (gibVal == null) td.append(el('span', 'fit unknown', '?'));
      else td.append(el('span', `fit ${gibVal < b ? 'yes' : 'no'}`, gibVal < b ? 'fits' : 'over'));
      tr.append(td);
    }
    tbody.append(tr);
  };
  for (const s of v.stages) row(s.label + (s.off ? ' (off)' : ''), s.name, s.gib);
  for (const p of v.pairs) row(`${p.a.label} + ${p.b.label.toLowerCase()} together`, null, p.gib);
  table.append(tbody);
  wrap.append(table);
  const note = el('p', 'hint vram-note', `Weights only, in GiB (1024³ bytes, the unit card memory is sold in). Activations, latents and the enhancer's KV cache need more on top. When two stages are “over” together, ComfyUI moves one out of VRAM between them.${v.unknown.length ? ` No published size for ${v.unknown.join(', ')}: paste an ls -l listing to include it.` : ''}`);
  wrap.append(note);
  if (v.measured.length || v.notMeasured.length) {
    const m = el('div', 'measured');
    m.append(el('p', 'label', 'On a real card'));
    if (v.measured.length) {
      const ul = el('ul');
      for (const r of v.measured) {
        const li = el('li');
        li.append(el('b', null, `${r.what}: peak ${r.peakMiB.toLocaleString('en-US')} MiB`), document.createTextNode(` (${gib(r.peakMiB * 1048576).toFixed(1)} GiB), ${r.tokensPerSec.join('–')} tokens/s. ${r.gpu}, ComfyUI ${r.comfy} with `), el('code', null, r.flags), document.createTextNode('.'));
        ul.append(li);
      }
      m.append(ul);
    }
    if (v.notMeasured.length) m.append(el('p', 'hint', `Not measured yet: ${v.notMeasured.join('; ')}.`));
    wrap.append(m);
  }
  if (!known.length && !v.unknown.length) return;
  byId('vram-wrap').hidden = false;
}

function focusResult() {
  const res = byId('result');
  res.focus({ preventScroll: true });
  if (window.matchMedia('(max-width: 900px)').matches) res.scrollIntoView({ block: 'start' });
}
