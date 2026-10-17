#!/usr/bin/env node
// Checks every internal href/src/srcset in dist/*.html: the target file must exist (or be
// redirected by public/_redirects), and any #fragment must match an id on the target page.
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const ORIGIN = 'https://www.plinth.co';

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const htmlFiles = await walk(DIST);
const pageFor = (urlPath) => {
  const clean = decodeURIComponent(urlPath).replace(/\/$/, '');
  const candidates = [path.join(DIST, clean, 'index.html'), path.join(DIST, clean + '.html'), path.join(DIST, clean)];
  return candidates.find((c) => existsSync(c) && !c.endsWith(path.sep));
};
const redirects = (await readFile(path.join(DIST, '_redirects'), 'utf8'))
  .split('\n')
  .filter((l) => l.trim() && !l.startsWith('#'))
  .map((l) => l.trim().split(/\s+/));
const redirected = (p) => redirects.some(([from]) => (from.endsWith('/*') ? p.startsWith(from.slice(0, -1)) : from === p));

const idsCache = new Map();
async function idsOf(file) {
  if (!idsCache.has(file)) {
    const html = await readFile(file, 'utf8');
    idsCache.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return idsCache.get(file);
}

const problems = [];
let checked = 0;
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const pagePath = '/' + path.relative(DIST, file).replace(/index\.html$/, '').replace(/\.html$/, '');
  const refs = [
    ...[...html.matchAll(/\s(?:href|src|poster)="([^"]+)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/\ssrcset="([^"]+)"/g)].flatMap((m) => m[1].split(',').map((s) => s.trim().split(/\s+/)[0])),
  ];
  for (let ref of refs) {
    ref = ref.replace(/&amp;/g, '&');
    if (/^(mailto:|tel:|data:|javascript:)/.test(ref)) continue;
    let url;
    try {
      url = new URL(ref, ORIGIN + pagePath);
    } catch {
      problems.push(`${pagePath}: unparseable ${ref}`);
      continue;
    }
    if (url.origin !== ORIGIN) continue; // external
    checked++;
    const target = pageFor(url.pathname);
    if (!target) {
      if (!redirected(url.pathname.replace(/\/$/, '') || '/')) problems.push(`${pagePath}: broken link ${ref}`);
      continue;
    }
    if (url.hash && target.endsWith('.html')) {
      const id = decodeURIComponent(url.hash.slice(1));
      if (!(await idsOf(target)).has(id)) problems.push(`${pagePath}: missing anchor ${ref}`);
    }
  }
}
console.log(`Checked ${checked} internal links/assets across ${htmlFiles.length} pages.`);
if (problems.length) {
  console.error(`✗ ${problems.length} problem(s):\n  ${[...new Set(problems)].join('\n  ')}`);
  process.exit(1);
}
console.log('✓ all internal links resolve');
