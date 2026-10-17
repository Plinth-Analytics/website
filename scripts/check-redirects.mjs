#!/usr/bin/env node
// Every URL the Webflow site served must resolve on the new build: either to a page in dist/
// or through public/_redirects to one. Run after `npm run build`.
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const dist = new URL('../dist/', import.meta.url);
const oldUrls = JSON.parse(await readFile(new URL('../src/data/webflow-urls.json', import.meta.url), 'utf8'));
const rules = (await readFile(new URL('_redirects', dist), 'utf8'))
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))
  .map((l) => l.split(/\s+/))
  .map(([from, to, status]) => ({ from, to, status: Number(status || 302) }));

const pageExists = (p) => {
  const clean = p.split('#')[0].replace(/\/$/, '');
  return clean === '' ? existsSync(new URL('index.html', dist)) : existsSync(new URL(`.${clean}/index.html`, dist)) || existsSync(new URL(`.${clean}.html`, dist));
};
const redirect = (p) => {
  for (const r of rules) {
    if (r.from.endsWith('/*')) {
      const base = r.from.slice(0, -2);
      if (p.startsWith(base + '/')) return r.to.replace(':splat', p.slice(base.length + 1));
    } else if (r.from === p) return r.to;
  }
  return null;
};

const failures = [];
for (const url of oldUrls) {
  if (url === '/404') continue; // the 404 page itself
  if (pageExists(url)) continue;
  const to = redirect(url);
  if (!to) failures.push(`${url} → (no page, no redirect)`);
  else if (!pageExists(to)) failures.push(`${url} → ${to} (target missing)`);
}
console.log(`Checked ${oldUrls.length} old Webflow URLs against dist/ and _redirects.`);
if (failures.length) {
  console.error(`✗ ${failures.length} would 404:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log('✓ none would 404');
