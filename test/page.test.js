// End-to-end in a real browser: the page checks a real exported file, sends nothing anywhere, and handles bad input.
// The four modules of the drawing (#slots) are the slot readout: the page opens on the bundled example's result, and a
// reader's own workflow replaces it. #verdict loses .empty once a check has rendered.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import test from 'node:test';
import { chromium } from 'playwright';
import { REPORTED, CONTROLS, toApi, t2iRepaired } from './labeled-set.js';

const TYPES = { html: 'text/html', js: 'text/javascript', css: 'text/css', svg: 'image/svg+xml', woff2: 'font/woff2', json: 'application/json', txt: 'text/plain', md: 'text/markdown' };
let server, browser, origin;
const offOrigin = [];

test.before(async () => {
  server = createServer(async (req, res) => {
    const path = new URL(req.url, 'http://x').pathname;
    const file = path === '/' ? 'index.html' : path.slice(1);
    if (file.includes('..') || !/^(index\.html|first-use\.html|[a-z-]+\.js|(style|nojs|first-use)\.css|assets\/[\w./-]+|fixtures\/(first-use\/[\w.-]+|official\/LICENSE\.txt))$/.test(file)) { res.writeHead(404).end(); return; }
    try {
      const body = await readFile(new URL(`../${file}`, import.meta.url));
      res.writeHead(200, { 'Content-Type': TYPES[file.split('.').at(-1)] || 'application/octet-stream' }).end(body);
    } catch { res.writeHead(404).end(); }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox'] });
});
test.after(async () => { await browser?.close(); server?.close(); });

async function open(width = 1440, path = '/') {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('request', r => { if (!r.url().startsWith(origin)) offOrigin.push(r.url()); });
  await page.goto(origin + path, { waitUntil: 'networkidle' });
  return { page, errors };
}

test('a dropped file with the PE in the text-encoder slot is caught, and nothing leaves the page', async () => {
  const { page, errors } = await open();
  const dir = await mkdtemp(join(tmpdir(), 'qwen-preflight-'));
  const file = join(dir, 'my_workflow.json');
  await writeFile(file, REPORTED.find(c => c.id === 'R1').workflow());
  const csp = await page.getAttribute('meta[http-equiv="Content-Security-Policy"]', 'content');
  assert.match(csp, /connect-src 'none'/);
  const fetchBlocked = await page.evaluate(() => fetch('https://example.com/').then(() => false, () => true));
  assert.ok(fetchBlocked, 'the security policy blocks network requests');
  await page.setInputFiles('#file', file);
  await page.waitForSelector('#verdict:not(.empty)');
  assert.match(await page.textContent('#verdict'), /1 thing to fix/);
  assert.match(await page.textContent('#fixes'), /The prompt enhancer is in the text-encoder slot/);
  assert.match(await page.textContent('#file-status'), /my_workflow\.json/);
  assert.equal((await page.$$('.slot.fail')).length, 1);
  assert.deepEqual(errors, []);
  assert.deepEqual(offOrigin, [], 'no request left the page origin');
  await page.close();
});

test('an API-format export with a folder listing checks clean at 390 px', async () => {
  const { page, errors } = await open(390);
  await page.fill('#workflow', JSON.stringify(toApi(t2iRepaired())));
  await page.click('#optional summary');
  await page.fill('#listing', CONTROLS.find(c => c.listing).listing);
  await page.click('button[type=submit]');
  await page.waitForSelector('#verdict:not(.empty)');
  assert.match(await page.textContent('#verdict'), /Nothing to fix/);
  assert.match(await page.textContent('#verdict'), /API-format/);
  assert.match(await page.textContent('#passes'), /ComfyUI 0\.38\.0 has every core node/);
  assert.match(await page.textContent('#vram'), /PE-T2I\) alone: peak 10,566 MiB \(10\.3 GiB\), 16\.6–18\.9 tokens\/s\. RTX 3090 24 GB, ComfyUI 0\.38\.0 with --gpu-only/);
  assert.match(await page.textContent('#vram'), /Not measured yet: the full graph on a 24 GB card\./);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
  assert.deepEqual(errors, []);
  await page.close();
});

test('the bundled official Image Edit template shows its unconnected system prompt', async () => {
  const { page } = await open();
  await page.click('#example');
  await page.waitForSelector('#verdict:not(.empty)');
  assert.match(await page.textContent('#fixes'), /The edit PE runs without its system prompt/);
  assert.doesNotMatch(await page.textContent('#fixes'), /max_length/);
  assert.match(await page.textContent('#notes'), /max_length is 16256; Qwen's runner uses 24,000.*Not measured here/);
  assert.match(await page.textContent('#file-status'), /templates package 0\.11\.70/);
  assert.ok(await page.isVisible('#vram-wrap'));
  assert.doesNotMatch(await page.textContent('#vram'), /peak/);
  assert.match(await page.textContent('#vram'), /Not measured yet: the full graph on a 24 GB card; the edit enhancer \(PE-I2I\)\./);
  await page.close();
});

test('the upstream-fixed Image Edit template, PE switched on, has nothing to fix', async () => {
  const { page, errors } = await open(390);
  await page.fill('#workflow', CONTROLS.find(c => /Image Edit template \(fixed, unreleased\), PE switched on/.test(c.name)).workflow());
  await page.click('button[type=submit]');
  await page.waitForSelector('#verdict:not(.empty)');
  assert.match(await page.textContent('#verdict'), /Nothing to fix/);
  assert.ok(await page.isHidden('#fixes-wrap'));
  assert.match(await page.textContent('#notes'), /max_length is 4096; Qwen's runner uses 24,000/);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
  assert.deepEqual(errors, []);
  await page.close();
});

test('broken, empty and non-Qwen input each get a plain answer', async () => {
  const { page, errors } = await open(390);
  await page.click('button[type=submit]');
  assert.match(await page.textContent('#form-error'), /Drop, choose or paste a workflow first/);
  await page.fill('#workflow', '{"nodes": [');
  await page.click('button[type=submit]');
  assert.match(await page.textContent('#verdict'), /not valid JSON/);
  await page.fill('#workflow', JSON.stringify({ nodes: [{ id: 1, type: 'CheckpointLoaderSimple', widgets_values: ['sd_xl_base_1.0.safetensors'] }], links: [] }));
  await page.click('button[type=submit]');
  assert.match(await page.textContent('#verdict'), /no Qwen-Image 2\.1 files or nodes/);
  await page.fill('#workflow', '[1, 2, 3]');
  await page.click('button[type=submit]');
  assert.match(await page.textContent('#verdict'), /not a ComfyUI workflow/);
  assert.deepEqual(errors, []);
  await page.close();
});

test('workflow text is rendered as text, never as markup', async () => {
  const { page } = await open();
  const wf = JSON.parse(REPORTED.find(c => c.id === 'R1').workflow());
  wf.definitions.subgraphs[0].nodes.find(n => n.id === 453).title = '<img src=x onerror="window.__pwned=1">';
  await page.fill('#workflow', JSON.stringify(wf));
  await page.click('button[type=submit]');
  await page.waitForSelector('#verdict:not(.empty)');
  assert.equal(await page.evaluate(() => window.__pwned), undefined);
  assert.match(await page.textContent('#fixes'), /<img src=x/);
  await page.close();
});

// Journeys from the redesign brief, (a) to (g), plus layout, keyboard and no-JS checks.
const fixture = name => readFile(new URL(`../fixtures/first-use/${name}`, import.meta.url), 'utf8');
const moduleStates = page => page.$$eval('#slots .slot', lis => lis.map(li => `${li.dataset.stage}:${['idle', 'pass', 'fail', 'dormant', 'warn', 'absent', 'missing'].find(s => li.classList.contains(s))}:${li.querySelector('.m-state').textContent}`));
// Repair the loaded UI-format example the way a user would: connect the PE-I2I system prompt and/or turn use_default_template on.
function repairExample(text, { connect, template }) {
  const wf = JSON.parse(text);
  const sg = wf.definitions.subgraphs[0];
  const node = id => sg.nodes.find(n => n.id === id);
  if (connect) {
    const to = node(500), slot = to.inputs.findIndex(i => i.name === 'system_prompt'), id = 90000 + sg.links.length;
    sg.links.push({ id, origin_id: 479, origin_slot: 0, target_id: 500, target_slot: slot, type: 'STRING' });
    to.inputs[slot].link = id;
    const out = node(479).outputs[0]; out.links = [...(out.links || []), id];
  }
  if (template) node(500).widgets_values[11] = true; // TextGenerate use_default_template
  return JSON.stringify(wf);
}
async function check(page, text) { await page.fill('#workflow', text); await page.click('button[type=submit]'); }

test('(a) the built-in broken example lights the enhancer and gives both repair steps', async () => {
  const { page, errors } = await open(390);
  assert.deepEqual(await moduleStates(page), ['pe:fail:Fix', 'te:pass:Fine', 'dit:pass:Fine', 'vae:pass:Fine'], 'the page opens on the example');
  await page.click('#example');
  await page.waitForSelector('#verdict:not(.empty)');
  assert.deepEqual(await moduleStates(page), ['pe:fail:Fix', 'te:pass:Fine', 'dit:pass:Fine', 'vae:pass:Fine']);
  assert.match(await page.textContent('#verdict'), /^1 thing to fix before you run this\./);
  const fix = await page.textContent('#fixes');
  assert.match(fix, /The edit PE runs without its system prompt/);
  assert.match(fix, /system_prompt/);
  assert.match(fix, /use_default_template/);
  assert.equal(await page.textContent('#assembly-caption'), 'Example · official template · 1 to fix');
  assert.deepEqual(errors, []);
  await page.close();
});

test('(b) connecting the system prompt and turning use_default_template on clears the failure; (c) connecting alone does not', async () => {
  const { page, errors } = await open();
  await page.click('#example');
  await page.waitForSelector('#verdict:not(.empty)');
  const example = await page.inputValue('#workflow');
  await check(page, repairExample(example, { connect: true, template: true }));
  assert.match(await page.textContent('#verdict'), /^Nothing to fix in what this page can check\./);
  assert.ok(await page.isHidden('#fixes-wrap'));
  assert.equal(await page.textContent('#assembly-caption'), 'Your workflow · 0 to fix', 'an edited example is the reader\'s own workflow');
  assert.equal(await page.$eval('#slots .m-pe', li => li.className.includes('pass')), true);
  assert.match(await page.textContent('#passes'), /system prompt/i);
  await check(page, repairExample(example, { connect: true, template: false }));
  assert.match(await page.textContent('#verdict'), /^1 thing to fix/);
  assert.match(await page.textContent('#fixes'), /The system prompt is connected, but Generate Text drops it/);
  assert.equal(await page.$eval('#slots .m-pe', li => li.className.includes('fail')), true);
  // The published first-use pair says the same thing in API format.
  await check(page, await fixture('corrected.api.json'));
  assert.match(await page.textContent('#verdict'), /^Nothing to fix/);
  await check(page, await fixture('broken.api.json'));
  assert.match(await page.textContent('#fixes'), /The edit PE runs without its system prompt/);
  assert.deepEqual(errors, []);
  await page.close();
});

test('(d) malformed JSON and a non-Qwen workflow leave every module "Not checked", never "Fine"', async () => {
  const { page, errors } = await open(390);
  await page.click('#example');
  await page.waitForSelector('#verdict:not(.empty)');
  await check(page, '{"nodes": [');
  assert.match(await page.textContent('#verdict'), /not valid JSON/);
  assert.deepEqual((await moduleStates(page)).map(s => s.split(':').slice(1).join(':')), Array(4).fill('idle:Not checked'));
  assert.match(await page.textContent('#assembly-state'), /could not be read/);
  assert.ok(await page.isHidden('#fixes-wrap'));
  await check(page, JSON.stringify({ nodes: [{ id: 1, type: 'CheckpointLoaderSimple', widgets_values: ['sd_xl_base_1.0.safetensors'] }], links: [] }));
  assert.match(await page.textContent('#verdict'), /no Qwen-Image 2\.1 files or nodes/);
  assert.equal((await page.$$('#slots .slot.idle')).length, 4);
  assert.equal(await page.$$eval('#slots .slot.idle .lamp', ls => ls.every(l => getComputedStyle(l).borderStyle === 'dashed')), true, 'not checked is drawn differently from a pass');
  assert.deepEqual(errors, []);
  await page.close();
});

test('(e) listing and version findings stay separate from the wiring fix', async () => {
  const { page, errors } = await open();
  await page.click('#optional summary');
  // Everything the example loads except its VAE.
  await page.fill('#listing', 'models/text_encoders/qwen3vl_8b_int8_convrot.safetensors\nmodels/diffusion_models/qwen_image_2.1_int8_convrot.safetensors\nmodels/text_encoders/qwen3.5_9b_qwen_image_2.1_pe_i2i.int8_convrot.safetensors');
  await page.click('#example');
  await page.waitForSelector('#verdict:not(.empty)');
  const titles = () => page.$$eval('#fixes > li', lis => lis.map(li => li.querySelector('.fix-title').textContent));
  let items = await titles();
  assert.equal(items.filter(t => /The edit PE runs without its system prompt/.test(t)).length, 1, 'the wiring fix is its own item');
  assert.ok(items.some(t => /A file this workflow loads is not in your listing/.test(t)), items.join(' | '));
  assert.deepEqual(await moduleStates(page), ['pe:fail:Fix', 'te:pass:Fine', 'dit:pass:Fine', 'vae:pass:Fine'], 'a listing note does not relight the modules');
  await page.fill('#version', '0.36.0');
  await page.click('button[type=submit]');
  items = await titles();
  assert.equal(items.filter(t => /The edit PE runs without its system prompt/.test(t)).length, 1);
  assert.ok(items.some(t => /ComfyUI 0\.36\.0 is too old/.test(t)), items.join(' | '));
  assert.match(await page.textContent('#verdict'), /^2 things to fix/);
  assert.deepEqual(errors, []);
  await page.close();
});

test('(f) file, paste and example routes make no request after load', async () => {
  const { page, errors } = await open(390);
  const after = [];
  page.on('request', r => after.push(r.url()));
  await page.click('#example');
  await page.waitForSelector('#verdict:not(.empty)');
  const dir = await mkdtemp(join(tmpdir(), 'qwen-preflight-'));
  const file = join(dir, 'broken.api.json');
  await writeFile(file, await fixture('broken.api.json'));
  await page.setInputFiles('#file', file);
  await page.waitForFunction(() => /broken\.api\.json/.test(document.getElementById('file-status').textContent));
  await check(page, await fixture('corrected.api.json'));
  await page.click('#optional summary');
  await page.click('.evidence summary');
  await page.waitForTimeout(300);
  assert.deepEqual(after, [], 'no request of any kind after load');
  assert.deepEqual(errors, []);
  await page.close();
});

test('(g) the first-use guide is linked and it and every file it links return 200', async () => {
  const { page, errors } = await open();
  assert.equal(await page.getAttribute('#example-note a', 'href'), 'first-use.html');
  await page.click('#example-note a');
  await page.waitForURL(/first-use\.html$/);
  const hrefs = await page.$$eval('a[href]', as => as.map(a => a.getAttribute('href')).filter(h => !/^(https?:|mailto:|#)/.test(h)));
  for (const f of ['broken.api.json', 'corrected.api.json', 'broken.expected.json', 'corrected.expected.json', 'LICENSE.txt', 'README.md']) assert.ok(hrefs.includes(`fixtures/first-use/${f}`), f);
  for (const h of new Set(hrefs)) {
    const res = await fetch(new URL(h, page.url()));
    assert.equal(res.status, 200, h);
  }
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 1440);
  assert.deepEqual(errors, []);
  await page.close();
});

test('320, 390 and 1440 renders have no horizontal overflow before or after a check', async () => {
  for (const width of [320, 390, 1440]) for (const path of ['/', '/first-use.html']) {
    const { page, errors } = await open(width, path);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, `${path} at ${width}`);
    if (path === '/') {
      await page.click('#example');
      await page.waitForSelector('#verdict:not(.empty)');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, `result at ${width}`);
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
});

test('on a phone the lit drawing and the start of the fix share the first screen after "Try the example"', async () => {
  for (const width of [390, 320]) {
    const { page, errors } = await open(width);
    await page.setViewportSize({ width, height: 844 });
    await page.evaluate(() => document.fonts.ready);
    await page.click('#example');
    await page.waitForSelector('#fixes-wrap:not([hidden])');
    const { art, fix, vh } = await page.evaluate(() => ({ art: document.querySelector('#assembly').getBoundingClientRect().top, fix: document.querySelector('#fixes .fix').getBoundingClientRect().top, vh: innerHeight }));
    assert.ok(art >= 0 && art < 100, `${width}: drawing top at ${art}`);
    assert.ok(fix < vh - 48, `${width}: fix card top at ${Math.round(fix)} of ${vh}`);
    assert.deepEqual(errors, []);
    await page.close();
  }
});

test('first screen: an example result, the maker and a 48 px upload target; the weekly email and source are in the footer', async () => {
  const { check } = await import('../engine.js');
  const { OFFICIAL_IMAGE_EDIT } = await import('../example.js');
  const real = check(OFFICIAL_IMAGE_EDIT, '', {});
  const [fix] = real.findings.filter(f => f.status === 'fail');
  for (const width of [390, 1440]) {
    const { page, errors } = await open(width);
    await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
    await page.evaluate(() => document.fonts.ready);
    // The sample is the bundled example's real output: the enhancer finding, and the fix's first sentence without its
    // version note (both clauses, so a reader who follows it alone does not keep the bug).
    assert.equal(real.slots[0].status, 'fail');
    assert.match(await page.textContent('.m-pe .m-role'), /^Prompt enhancer/);
    assert.equal(await page.textContent('#sample-result .sample-verdict'), `Found Prompt enhancer: ${fix.title}`);
    const firstSentence = fix.fix.slice(0, fix.fix.indexOf('. ') + 1).replace(' (ComfyUI 0.38.0+)', '');
    assert.match(firstSentence, /, and turn use_default_template on\.$/);
    assert.equal((await page.textContent('#sample-result .sample-fix')).replace(/^Fix\s*/, ''), firstSentence);
    assert.match(await page.textContent('#sample-label'), /^Example result/);
    const vh = 0 + (await page.viewportSize()).height;
    const bottom = sel => page.evaluate(s => document.querySelector(s).getBoundingClientRect().bottom, sel);
    assert.ok(await bottom('#sample-result') <= vh, `${width}: sample ends at ${await bottom('#sample-result')}`);
    assert.ok(await bottom('.maker') <= vh, 'maker line on the first screen');
    assert.ok(await bottom('#example') <= vh, 'example button on the first screen');
    assert.ok(await bottom('label.file-btn') <= vh, `${width}: upload button ends at ${await bottom('label.file-btn')}`);
    assert.equal(await page.textContent('.maker a'), 'Made by CyberNative AI LLC, an AI-run company');
    assert.equal(await page.getAttribute('.maker a', 'href'), 'https://cybernative.ai/about/');
    assert.equal(await page.getAttribute('.maker a.maker-check', 'href'), 'https://cybernative.ai/about/#how-we-check');
    assert.equal((await page.textContent('.maker')).replace(/\s+/g, ' ').trim(), 'Made by CyberNative AI LLC, an AI-run company·How we check', 'Content\'s words, verbatim');
    const target = await page.locator('#file').boundingBox();
    assert.ok(target.height >= 48, `upload target is ${target.height} px tall`);
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.local-badge'), '::before').content), 'none', 'no status dot');
    assert.equal((await page.textContent('.local-badge')).replace(/\s+/g, ' '), 'Runs in your browser, offline');
    assert.equal(await page.isVisible('.local-badge .badge-more'), width >= 600, 'a phone shows "Runs offline"');
    assert.equal(await page.getAttribute('.site-footer a >> text=Get the weekly email: what breaks next', 'href'), 'https://cybernative.ai/breakage-calendar/#wbn-email-calendar');
    assert.equal(await page.getAttribute('.site-footer a >> text=Source on GitHub', 'href'), 'https://github.com/CyberNative-AI/comfy-qwen-preflight');
    assert.equal(await page.locator('.site-footer form').count(), 0, 'a link, not a form');
    assert.deepEqual(errors, []);
    await page.close();
  }
});

test('48 px for each byline link, the second never split; the example is solid-bordered and as wide as the drop zone', async () => {
  for (const width of [320, 390, 1440]) {
    const { page, errors } = await open(width);
    await page.evaluate(() => document.fonts.ready);
    const links = await page.evaluate(() => [...document.querySelectorAll('.maker a')].map(a => {
      const rects = [...a.getClientRects()];
      const range = document.createRange(); range.selectNodeContents(a);
      return { text: a.textContent, lines: new Set([...range.getClientRects()].map(r => Math.round(r.top))).size, boxes: rects.map(r => {
        const hits = y => { const e = document.elementFromPoint(r.left + Math.min(r.width / 2, 40), y); return !!e && a.contains(e); };
        return { height: r.height, top: hits(r.top + 1), bottom: hits(r.bottom - 1) };
      }) };
    }));
    assert.equal(links.length, 2);
    for (const link of links) for (const box of link.boxes) assert.ok(box.height >= 48 && box.top && box.bottom, `${width}: ${link.text} ${JSON.stringify(box)}`);
    assert.equal(links[1].lines, 1, `${width}: the second link is never split`);
    // A dashed border on this page means "drop here": the example must not look like a second drop target.
    const [sample, drop] = await page.evaluate(() => ['#sample-result', '.drop'].map(s => {
      const e = document.querySelector(s), r = e.getBoundingClientRect();
      return { left: Math.round(r.left), right: Math.round(r.right), style: getComputedStyle(e).borderTopStyle };
    }));
    assert.equal(sample.style, 'solid');
    assert.equal(drop.style, 'dashed');
    assert.deepEqual([sample.left, sample.right], [drop.left, drop.right], `${width}: one column edge`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0);
    assert.deepEqual(errors, []);
    await page.close();
  }
});

test('the example result gives way to a real result: after "Try the example" and after a dropped file', async () => {
  for (const route of ['example', 'file']) {
    const { page, errors } = await open(390);
    assert.equal(await page.isVisible('#sample-result'), true);
    if (route === 'example') await page.click('#example');
    else {
      const dir = await mkdtemp(join(tmpdir(), 'qwen-preflight-'));
      const file = join(dir, 'my_workflow.json');
      await writeFile(file, REPORTED.find(c => c.id === 'R1').workflow());
      await page.setInputFiles('#file', file);
    }
    await page.waitForSelector('#verdict:not(.empty)');
    assert.equal(await page.isVisible('#sample-result'), false, route);
    assert.deepEqual(errors, []);
    await page.close();
  }
});

test('keyboard: the actions come first and every stop shows a focus ring', async () => {
  const { page } = await open(390);
  const stops = [];
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    stops.push(await page.evaluate(() => {
      const a = document.activeElement, cs = getComputedStyle(a.matches('input[type=file]') ? a.parentElement : a);
      return { id: a.id || a.textContent.trim().slice(0, 30), ring: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2 };
    }));
  }
  const ids = stops.map(s => s.id);
  assert.ok(ids.indexOf('example') > -1 && ids.indexOf('example') < ids.indexOf('file') && ids.indexOf('file') < ids.indexOf('workflow'), ids.join(' > '));
  assert.ok(stops.every(s => s.ring), JSON.stringify(stops));
  await page.close();
});

test('with JavaScript off the page explains why it cannot check, and hides the form', async () => {
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(origin + '/', { waitUntil: 'networkidle' });
  assert.ok(await page.isVisible('.nojs'));
  assert.match(await page.textContent('.nojs'), /cannot run here/);
  assert.doesNotMatch(await page.textContent('.nojs'), /beside|to the (left|right)/);
  assert.ok(await page.isHidden('#form'));
  assert.ok(await page.isHidden('#result'));
  assert.ok(await page.isVisible('#assembly'));
  assert.deepEqual(await moduleStates(page), ['pe:fail:Fix', 'te:pass:Fine', 'dit:pass:Fine', 'vae:pass:Fine'], 'the static drawing is the example');
  assert.equal(await page.textContent('#assembly-caption'), 'Example · official template · 1 to fix');
  await ctx.close();
});

test('C1: the page opens on the example drawn exactly as "Try the example" draws it; a reader\'s file replaces it', async () => {
  const { page, errors } = await open(1440);
  const drawing = () => page.evaluate(() => [document.getElementById('assembly-caption').textContent, document.getElementById('slots').innerHTML]);
  const opened = await drawing();
  assert.equal(opened[0], 'Example · official template · 1 to fix');
  assert.match(await page.textContent('#sample-label'), /^Example result · lit on the drawing$/);
  assert.equal(await page.getAttribute('#example', 'class'), 'btn btn-primary', 'the example is the filled button');
  assert.match(await page.getAttribute('label.file-btn', 'class'), /\bbtn-quiet\b/, 'the picker is the outline button');
  assert.ok(await page.evaluate(() => document.getElementById('example').compareDocumentPosition(document.getElementById('file')) & Node.DOCUMENT_POSITION_FOLLOWING), 'the example comes first');
  await page.click('#example');
  await page.waitForSelector('#verdict:not(.empty)');
  assert.deepEqual(await drawing(), opened, 'static markup == rendered example');
  const dir = await mkdtemp(join(tmpdir(), 'qwen-preflight-'));
  const file = join(dir, 'corrected.api.json');
  await writeFile(file, await fixture('corrected.api.json'));
  await page.setInputFiles('#file', file);
  await page.waitForFunction(() => /^Your workflow/.test(document.getElementById('assembly-caption').textContent));
  assert.equal(await page.textContent('#assembly-caption'), 'Your workflow · 0 to fix');
  assert.equal(await page.$eval('#slots .m-pe', li => li.classList.contains('pass')), true);
  assert.equal(await page.isVisible('#sample-result'), false);
  assert.deepEqual(errors, []);
  await page.close();
});

test('C2: the VRAM plan comes from the workflow alone; the optional row says what it adds', async () => {
  const { page, errors } = await open(1440);
  assert.match(await page.textContent('#verdict'), /a VRAM plan from the published file sizes/);
  assert.equal((await page.textContent('#optional summary')).replace(/\s+/g, ' ').trim(), 'Your model files and ComfyUI version optional: finds files in the wrong folder and checks your version');
  await page.click('#example');
  await page.waitForSelector('#verdict:not(.empty)');
  assert.equal(await page.$eval('#optional', d => d.open), false, 'the optional row stayed closed');
  assert.equal(await page.isVisible('#vram-wrap'), true, 'the plan is there without the optional row');
  assert.equal(await page.$$eval('#vram tbody tr', rows => rows.length), 6, 'four stages and two pairs');
  assert.deepEqual(errors, []);
  await page.close();
});

test('C3: the first screen after picking a file shows the result at 390x844 and 320x568', async () => {
  for (const [width, height] of [[390, 844], [320, 568]]) {
    const { page, errors } = await open(width);
    await page.setViewportSize({ width, height });
    await page.evaluate(() => document.fonts.ready);
    assert.match(await page.textContent('#file-status'), /checked at once/);
    const dir = await mkdtemp(join(tmpdir(), 'qwen-preflight-'));
    const file = join(dir, 'broken.api.json');
    await writeFile(file, await fixture('broken.api.json'));
    await page.setInputFiles('#file', file);
    await page.waitForSelector('#verdict:not(.empty)');
    const m = await page.evaluate(() => {
      const box = s => { const r = document.querySelector(s).getBoundingClientRect(); return [r.top, r.bottom]; };
      return { caption: box('#assembly-caption'), pe: box('#slots .m-pe'), verdict: box('#verdict'), vh: innerHeight };
    });
    assert.equal(await page.textContent('#assembly-caption'), 'Your workflow · 1 to fix');
    assert.ok(m.caption[0] >= 0 && m.pe[1] <= m.vh, `${width}x${height}: caption and the lit enhancer on screen ${JSON.stringify(m)}`);
    if (height >= 844) assert.ok(m.verdict[1] <= m.vh, `${width}x${height}: verdict on screen ${JSON.stringify(m)}`);
    assert.deepEqual(errors, []);
    await page.close();
  }
});
