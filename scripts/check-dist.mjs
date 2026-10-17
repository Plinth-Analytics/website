#!/usr/bin/env node
// Post-build audit of dist/:
//  - fails on any Webflow CDN / Webflow / ibb.co / staging URL
//  - fails on a hard-coded copyright year that isn't the current one
//  - lists every remaining "2024" with context (real content dates are expected)
//  - if WEBFLOW_API_TOKEN is set, fails if the token appears in dist/, the working tree or any
//    commit in git history (the token itself is never printed)
import { readFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const TEXT = /\.(html|css|js|mjs|json|xml|txt|svg|webmanifest)$|^_(headers|redirects)$/;

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const forbidden = [
  ['Webflow CDN', /website-files\.com/i],
  ['Webflow', /webflow\.(com|io)/i],
  ['Webflow S3', /webflow-prod-assets/i],
  ['ibb.co', /ibb\.co/i],
  ['staging URL', /plinth-staging|staging\.plinth/i],
];
const year = new Date().getFullYear();
const failures = [];
const mentions2024 = [];
const files = await walk(DIST);
const names2024 = files.filter((f) => path.basename(f).includes('2024')).map((f) => path.relative(DIST, f));

for (const file of files) {
  const rel = path.relative(DIST, file);
  if (!TEXT.test(path.basename(file))) continue;
  const text = await readFile(file, 'utf8');
  for (const [label, re] of forbidden) {
    const m = text.match(re);
    if (m) failures.push(`${label} in ${rel}: …${text.slice(Math.max(0, m.index - 60), m.index + 60)}…`);
  }
  // Site copyright lines only (third-party licence files legitimately carry their own years).
  if (rel.endsWith('.html')) for (const m of text.matchAll(/(?:©|&copy;|copyright)[^<\n]{0,40}?\b(20\d\d)\b/gi)) {
    if (Number(m[1]) !== year) failures.push(`stale copyright year in ${rel}: ${m[0]}`);
  }
  if (rel.endsWith('.html')) {
    const visible = text.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
    // Classify each occurrence: page text, a date attribute, or an asset file name.
    for (const m of visible.matchAll(/2024/g)) {
      const before = visible.slice(Math.max(0, m.index - 120), m.index);
      const inTag = before.lastIndexOf('<') > before.lastIndexOf('>');
      const kind = !inTag ? 'text' : /asco2024poster/.test(visible.slice(m.index - 5, m.index + 10)) ? 'asset file name' : 'attribute';
      const text = visible.slice(0, m.index).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(-45) + visible.slice(m.index, m.index + 30).replace(/<[\s\S]*$/, '');
      mentions2024.push(kind === 'text' ? `text: …${text.trim()}` : kind);
    }
  }
}

const token = process.env.WEBFLOW_API_TOKEN;
if (token) {
  const hit = (args) => spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 30 }).stdout.includes(token);
  for (const file of files) if ((await readFile(file)).includes(token)) failures.push(`API token found in dist/${path.relative(DIST, file)}`);
  if (hit(['grep', '-I', '--untracked', '-F', '-l', '-e', token])) failures.push('API token found in the working tree');
  if (hit(['log', '--all', '-p', '--no-color'])) failures.push('API token found in git history');
  console.log('✓ token scan ran over dist/, working tree and git history');
} else {
  console.log('! WEBFLOW_API_TOKEN not set — token scan skipped');
}

console.log(`Scanned ${files.length} files in dist/.`);
if (mentions2024.length || names2024.length) {
  console.log(`"2024" remains in ${mentions2024.length} place(s) of page text/attributes and ${names2024.length} file name(s):`);
  const counts = new Map();
  for (const m of mentions2024) counts.set(m, (counts.get(m) ?? 0) + 1);
  for (const [m, n] of counts) console.log(`  ${n}× ${m}`);
  console.log(`  ${names2024.length}× output file named after the source image "asco2024poster"`);
}
if (failures.length) {
  console.error(`✗ ${failures.length} failure(s):\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log('✓ no Webflow/ibb.co/staging URLs, no stale copyright year');
