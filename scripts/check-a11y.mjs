#!/usr/bin/env node
// Browser QA against a running preview (default http://127.0.0.1:4321):
//  - axe-core WCAG 2.x A/AA rules on every page, desktop and mobile
//  - no console errors (which includes CSP violations)
//  - contact form: client-side validation, success state and error state (Formspree is
//    intercepted, nothing is sent)
// Usage: npm run build && npm run preview & BASE=http://127.0.0.1:4321 node scripts/check-a11y.mjs
import { chromium } from 'playwright';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const axeSource = await readFile(require.resolve('axe-core/axe.min.js'), 'utf8');
const BASE = process.env.BASE || 'http://127.0.0.1:4321';
const DIST = new URL('../dist/', import.meta.url);

async function pages(dir = DIST.pathname, prefix = '') {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.isDirectory() && !e.name.startsWith('_')) out.push(...(await pages(path.join(dir, e.name), `${prefix}/${e.name}`)));
    else if (e.name === 'index.html') out.push(prefix || '/');
  }
  return out;
}
const paths = [...(await pages()), '/404'];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const problems = [];
for (const [label, viewport] of [
  ['desktop', { width: 1440, height: 900 }],
  ['mobile', { width: 390, height: 844 }],
]) {
  const ctx = await browser.newContext({ viewport });
  // Analytics are third-party; keep QA hermetic.
  await ctx.route(/googletagmanager|google-analytics|doubleclick|googleadservices/, (r) => r.abort());
  for (const p of paths) {
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text()) && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(BASE + p, { waitUntil: 'load' });
    await page.evaluate(axeSource); // via CDP, so the page CSP (rightly) does not block it
    const result = await page.evaluate(() =>
      // @ts-ignore
      window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } }),
    );
    for (const v of result.violations)
      problems.push(`[${label}] ${p}: ${v.id} (${v.impact}) ×${v.nodes.length} — ${v.help}: ${v.nodes[0].target.join(' ')}`);
    for (const e of errors) problems.push(`[${label}] ${p}: console error — ${e.slice(0, 200)}`);
    await page.close();
  }
  await ctx.close();
}

// Contact form behaviour.
const ctx = await browser.newContext();
const page = await ctx.newPage();
let posted = 0;
let respond = 200;
await page.route('https://formspree.io/**', async (route) => {
  posted++;
  await route.fulfill({ status: respond, contentType: 'application/json', body: respond === 200 ? '{"ok":true}' : '{"error":"x"}' });
});
await page.goto(BASE + '/contact');
if (await page.locator('[data-contact-form]').count()) {
  await page.click('[data-contact-form] button[type=submit]');
  if (posted !== 0) problems.push('form: submitted while empty');
  if (!(await page.locator('[data-status]').isVisible())) problems.push('form: no validation message shown');
  await page.fill('input[name=name]', 'QA Test');
  await page.fill('input[name=email]', 'qa@example.com');
  await page.fill('textarea[name=message]', 'Automated QA message');
  respond = 500;
  await page.click('[data-contact-form] button[type=submit]');
  await page.waitForFunction(() => document.querySelector('[data-status]')?.classList.contains('is-error'));
  respond = 200;
  await page.click('[data-contact-form] button[type=submit]');
  await page.waitForSelector('[data-thanks]:not([hidden])');
  if (posted !== 2) problems.push(`form: expected 2 POSTs, saw ${posted}`);
  // Off-screen (the usual honeypot technique): Playwright still calls a 1×1 off-screen box "visible".
  const box = await page.locator('input[name=_gotcha]').boundingBox();
  if (box && box.x + box.width > 0) problems.push('form: honeypot field is on screen');
  console.log('✓ contact form: validation, error state and thank-you state work');
} else {
  console.log('! contact form not rendered (PUBLIC_FORMSPREE_ID unset) — form test skipped');
}
await browser.close();

console.log(`Checked ${paths.length} pages × 2 viewports with axe-core (WCAG 2.2 AA).`);
if (problems.length) {
  console.error(`✗ ${problems.length} problem(s):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log('✓ no axe violations, no console/CSP errors');
