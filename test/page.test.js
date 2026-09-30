// End-to-end in a real browser: the page checks a real exported file, sends nothing anywhere, and handles bad input.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import test from 'node:test';
import { chromium } from 'playwright';
import { REPORTED, CONTROLS, toApi, t2iRepaired } from './labeled-set.js';

const TYPES = { html: 'text/html', js: 'text/javascript', css: 'text/css', svg: 'image/svg+xml', woff2: 'font/woff2' };
let server, browser, origin;
const offOrigin = [];

test.before(async () => {
  server = createServer(async (req, res) => {
    const path = new URL(req.url, 'http://x').pathname;
    const file = path === '/' ? 'index.html' : path.slice(1);
    if (file.includes('..') || !/^(index\.html|[a-z-]+\.js|style\.css|assets\/[\w./-]+)$/.test(file)) { res.writeHead(404).end(); return; }
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

async function open(width = 1440) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('request', r => { if (!r.url().startsWith(origin)) offOrigin.push(r.url()); });
  await page.goto(origin + '/');
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
  await page.waitForSelector('#slots:not([hidden])');
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
  await page.fill('#listing', CONTROLS.find(c => c.listing).listing);
  await page.click('button[type=submit]');
  await page.waitForSelector('#slots:not([hidden])');
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
  await page.waitForSelector('#slots:not([hidden])');
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
  await page.waitForSelector('#slots:not([hidden])');
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
  await page.waitForSelector('#slots:not([hidden])');
  assert.equal(await page.evaluate(() => window.__pwned), undefined);
  assert.match(await page.textContent('#fixes'), /<img src=x/);
  await page.close();
});
