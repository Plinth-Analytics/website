#!/usr/bin/env node
// Re-runnable export of the plinth.co Webflow site into this Astro repo.
//
// Uses the Webflow Data API v2 directly: the Webflow CLI only covers DevLink,
// Designer extensions and Cloud apps, and cannot export CMS items, assets or
// form submissions.
//
//   WEBFLOW_API_TOKEN=... npm run export:webflow
//
// Env:
//   WEBFLOW_API_TOKEN   (required) Data API token. Never logged or written anywhere.
//   WEBFLOW_SITE_ID     (optional) defaults to the site serving plinth.co
//   PRIVATE_EXPORT_DIR  (optional) where personal data (form submissions) and raw API
//                       dumps go. Must be OUTSIDE the repo. Default: ../webflow-private-export
//   LIVE_ORIGIN         (optional) live site crawled for assets the API doesn't list
//                       (e.g. hero video transcodes). Default: https://www.plinth.co
//
// Writes (inside the repo):
//   src/content/case-studies/<slug>.md   one file per "Stories" CMS item, all fields kept
//   src/data/{testimonials,team,technologies,jobs}.json
//   src/data/webflow-assets.json         original CDN URL -> local path manifest
//   src/assets/webflow/*                 downloaded assets, CMS images and hero video
// Writes (outside the repo):
//   $PRIVATE_EXPORT_DIR/form-submissions-<date>.csv
//   $PRIVATE_EXPORT_DIR/raw/*.json

import { mkdir, writeFile, stat, readdir, unlink, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import contentFixes from './content-fixes.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://api.webflow.com/v2';
const TOKEN = process.env.WEBFLOW_API_TOKEN;
const LIVE_ORIGIN = (process.env.LIVE_ORIGIN || 'https://www.plinth.co').replace(/\/$/, '');
const PRIVATE_DIR = path.resolve(process.env.PRIVATE_EXPORT_DIR || path.join(ROOT, '..', 'webflow-private-export'));

const CASE_STUDY_DIR = path.join(ROOT, 'src/content/case-studies');
const DATA_DIR = path.join(ROOT, 'src/data');
// Assets live under src/ so Astro can optimise images and fingerprint every URL at build time.
const ASSET_DIR = path.join(ROOT, 'src/assets/webflow');
const ASSET_URL_PREFIX = '/src/assets/webflow/'; // Vite root-relative; see src/lib/assets.ts
// Markdown lives in src/content/case-studies/, so assets are two levels up from it.
const toCaseStudyRelative = (s) => s && s.replaceAll(ASSET_URL_PREFIX, '../../assets/webflow/');

// Webflow's name for the case-studies collection on this site.
const CASE_STUDY_COLLECTION_SLUG = 'stories';

if (!TOKEN) fail('WEBFLOW_API_TOKEN is not set.');
if (PRIVATE_DIR === ROOT || PRIVATE_DIR.startsWith(ROOT + path.sep)) {
  fail(`PRIVATE_EXPORT_DIR (${PRIVATE_DIR}) is inside the repo. Personal data must be written outside it.`);
}

function fail(msg) {
  console.error(`export-webflow: ${msg}`);
  process.exit(1);
}

// ---------------------------------------------------------------- API helpers

async function api(pathname, attempt = 0) {
  const res = await fetch(API + pathname, {
    headers: { Authorization: `Bearer ${TOKEN}`, accept: 'application/json' },
  });
  if (res.status === 429 && attempt < 5) {
    const wait = Number(res.headers.get('retry-after') || 2 ** attempt) * 1000;
    await new Promise((r) => setTimeout(r, wait));
    return api(pathname, attempt + 1);
  }
  if (!res.ok) {
    // Body may echo request details but never the Authorization header.
    throw new Error(`Webflow API ${res.status} on ${pathname}: ${(await res.text()).slice(0, 300)}`);
  }
  return res.json();
}

/** Fetch every page of an offset-paginated list endpoint. */
async function apiAll(pathname, key, limit = 100) {
  const out = [];
  for (let offset = 0; ; offset += limit) {
    const sep = pathname.includes('?') ? '&' : '?';
    const page = await api(`${pathname}${sep}limit=${limit}&offset=${offset}`);
    out.push(...(page[key] || []));
    const total = page.pagination?.total ?? out.length;
    if (out.length >= total || !(page[key] || []).length) break;
  }
  return out;
}

// ------------------------------------------------------------- asset handling

const CDN_RE =
  /https?:\/\/(?:[a-z0-9-]+\.)*(?:website-files\.com|webflow\.com|webflow\.io)\/[^\s"'()<>,]+|https?:\/\/s3\.amazonaws\.com\/webflow-prod-assets\/[^\s"'()<>,]+/gi;
const ASSET_EXT_RE = /\.(png|jpe?g|gif|webp|avif|svg|ico|mp4|webm|mov|pdf|woff2?|ttf|otf)$/i;

/** CDN url -> local path (ASSET_URL_PREFIX + file name) */
const assetMap = new Map();

function localNameFor(url) {
  // Webflow CDN encodes "site/file" as "site%2Ffile" for some assets (videos).
  const decoded = decodeURIComponent(new URL(url).pathname);
  const base = decoded.split('/').pop();
  return base
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-(?=\.)/g, '')
    .toLowerCase();
}

function registerAsset(rawUrl) {
  if (!rawUrl) return null;
  const url = rawUrl.replace(/&amp;/g, '&').trim();
  if (assetMap.has(url)) return assetMap.get(url);
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(url).pathname);
  } catch {
    return null;
  }
  if (!ASSET_EXT_RE.test(pathname)) return null; // skip css/js/html
  if (pathname.startsWith('/plugins/')) return null; // Webflow's built-in placeholders, not site assets
  const local = ASSET_URL_PREFIX + localNameFor(url);
  assetMap.set(url, local);
  return local;
}

// URLs inside HTML attributes are delimited by quotes, so they may contain parentheses
// (e.g. "Poster%20(1).pdf") that CDN_RE stops at.
const ATTR_URL_RE = /((?:src|href|srcset|poster|data-[\w-]+)\s*=\s*")([^"]+)"/gi;
function rewriteHtmlAttrs(html) {
  return html.replace(ATTR_URL_RE, (all, pre, value) => {
    if (!new RegExp(CDN_RE.source, 'i').test(value)) return all;
    const local = assetMap.get(value.replace(/&amp;/g, '&')) || registerAsset(value);
    return local ? `${pre}${local}"` : all;
  });
}

/** Replace every registered CDN URL in a string with its local path. */
function rewriteUrls(text) {
  if (!text) return text;
  return text.replace(CDN_RE, (m) => {
    const clean = m.replace(/&amp;/g, '&');
    return assetMap.get(clean) || registerAsset(clean) || m;
  });
}

async function downloadAll() {
  await mkdir(ASSET_DIR, { recursive: true });
  // Several CDN URLs (cdn vs s3 host) can map to one local file; download each file once.
  const byLocal = new Map();
  for (const [url, local] of assetMap) if (!byLocal.has(local)) byLocal.set(local, url);
  const jobs = [...byLocal.entries()];
  let done = 0;
  let skipped = 0;
  const failures = [];
  const worker = async () => {
    while (jobs.length) {
      const [local, url] = jobs.shift();
      const dest = path.join(ROOT, local);
      if (existsSync(dest) && (await stat(dest)).size > 0) {
        skipped++;
        continue;
      }
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await writeFile(dest, Buffer.from(await res.arrayBuffer()));
        done++;
      } catch (err) {
        failures.push(`${url} (${err.message})`);
      }
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  return { files: byLocal.size, downloaded: done, alreadyPresent: skipped, failures };
}

// ------------------------------------------------------------ rich text -> md

const turndown = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced' });
turndown.use(gfm);
turndown.addRule('webflowFigure', {
  filter: (node) => node.nodeName === 'FIGURE',
  replacement: (_content, node) => {
    const img = node.querySelector('img');
    const iframe = node.querySelector('iframe');
    const caption = node.querySelector('figcaption')?.textContent?.trim();
    if (img) return `\n\n![${img.getAttribute('alt') || caption || ''}](${img.getAttribute('src')})\n\n`;
    if (iframe) return `\n\n<iframe src="${iframe.getAttribute('src')}" title="${caption || 'Embedded content'}" loading="lazy" allowfullscreen></iframe>\n\n`;
    return '';
  },
});

function richTextToMarkdown(html) {
  if (!html) return '';
  const cleaned = rewriteHtmlAttrs(html)
    .replace(/‍/g, '') // Webflow's zero-width-joiner spacer paragraphs
    .replace(/\s+id=""/g, '')
    .replace(/<p>\s*<\/p>/g, '');
  const md = rewriteUrls(turndown.turndown(cleaned)).replace(/\n{3,}/g, '\n\n').trim() + '\n';
  return shiftHeadings(md);
}

// Webflow rich text starts at h3–h5, but the page template supplies the h1. Shift headings up
// so the highest is an h2 and the document outline has no gaps.
function shiftHeadings(md) {
  const levels = [...md.matchAll(/^(#{1,6})\s/gm)].map((m) => m[1].length);
  const shift = levels.length ? Math.min(...levels) - 2 : 0;
  if (shift <= 0) return md;
  return md.replace(/^(#{1,6})(?=\s)/gm, (h) => '#'.repeat(Math.max(2, h.length - shift)));
}

// ------------------------------------------------------------- content fixes

const fixReport = [];
function applyFixes(target, text) {
  for (const fix of contentFixes.filter((f) => f.target === target && !f.field)) {
    const matched = typeof fix.find === 'string' ? text.includes(fix.find) : new RegExp(fix.find.source, fix.find.flags.replace('g', '')).test(text);
    if (matched) text = typeof fix.find === 'string' ? text.split(fix.find).join(fix.replace) : text.replace(fix.find, fix.replace);
    fixReport.push({ target, kind: fix.kind, matched });
  }
  return text;
}
function applyFieldOverrides(target, row) {
  for (const fix of contentFixes.filter((f) => f.target === target && f.field)) {
    row[fix.field] = fix.replace;
    fixReport.push({ target, kind: fix.kind, matched: true });
  }
  return row;
}

// ----------------------------------------------------------------- serialise

/** Minimal YAML emitter: JSON scalars are valid YAML, so quote via JSON.stringify. */
function toYaml(value, indent = '') {
  if (Array.isArray(value)) {
    if (!value.length) return ' []';
    return value.map((v) => `\n${indent}- ${toYaml(v, indent + '  ').replace(/^\n\s*/, '')}`).join('');
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value);
    if (!keys.length) return ' {}';
    return keys.map((k) => `\n${indent}${k}:${scalarOrNested(value[k], indent + '  ')}`).join('');
  }
  return ' ' + JSON.stringify(value ?? null);
}
function scalarOrNested(v, indent) {
  return v && typeof v === 'object' ? toYaml(v, indent) : ' ' + JSON.stringify(v ?? null);
}

function csvCell(v) {
  const s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const camel = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

/** Map a CMS item's fieldData to plain values: option ids -> names, images -> local paths. */
function mapFields(item, collection) {
  const out = {};
  for (const field of collection.fields) {
    const raw = item.fieldData[field.slug];
    let v = raw ?? null;
    if (field.type === 'Option' && raw) {
      const opt = field.validations?.options?.find((o) => o.id === raw);
      v = opt ? opt.name : raw;
    } else if (field.type === 'Image' && raw) {
      v = { src: registerAsset(raw.url), alt: raw.alt ?? null, webflowFileId: raw.fileId ?? null };
    } else if (field.type === 'MultiImage' && Array.isArray(raw)) {
      v = raw.map((img) => ({ src: registerAsset(img.url), alt: img.alt ?? null, webflowFileId: img.fileId ?? null }));
    } else if (field.type === 'RichText') {
      v = raw; // converted by the caller
    } else if (typeof raw === 'string') {
      v = rewriteUrls(raw);
    }
    out[camel(field.slug)] = v;
  }
  return out;
}

const status = (item) => ({
  isDraft: item.isDraft,
  isArchived: item.isArchived,
  published: !item.isDraft && !item.isArchived,
});

const meta = (item) => ({
  webflowId: item.id,
  createdOn: item.createdOn,
  lastUpdated: item.lastUpdated,
  lastPublished: item.lastPublished ?? null,
});

// ----------------------------------------------------------------------- main

async function main() {
  await mkdir(path.join(PRIVATE_DIR, 'raw'), { recursive: true });
  const dumpRaw = (name, data) => writeFile(path.join(PRIVATE_DIR, 'raw', `${name}.json`), JSON.stringify(data, null, 2));

  // Site
  const { sites } = await api('/sites');
  const site = process.env.WEBFLOW_SITE_ID
    ? sites.find((s) => s.id === process.env.WEBFLOW_SITE_ID)
    : sites.find((s) => s.customDomains?.some((d) => d.url.replace(/^www\./, '') === 'plinth.co'));
  if (!site) fail('Could not find the plinth.co site (set WEBFLOW_SITE_ID).');
  console.log(`Site: ${site.displayName} (${site.id})`);

  // Pages, assets, collections
  const pages = await apiAll(`/sites/${site.id}/pages`, 'pages');
  const assets = await apiAll(`/sites/${site.id}/assets`, 'assets');
  const { collections: collectionList } = await api(`/sites/${site.id}/collections`);
  const collections = {};
  for (const c of collectionList) {
    const detail = await api(`/collections/${c.id}`);
    const items = await apiAll(`/collections/${c.id}/items`, 'items');
    collections[c.slug] = { ...detail, items };
  }
  await dumpRaw('site', site);
  await dumpRaw('pages', pages);
  await dumpRaw('assets', assets);
  await dumpRaw('collections', collections);

  // 1. Every site asset from the Assets API.
  for (const a of assets) registerAsset(a.hostedUrl);
  // The live site serves the same files from cdn.prod.website-files.com; map those too.
  for (const a of assets) {
    const cdnUrl = a.hostedUrl.replace('https://s3.amazonaws.com/webflow-prod-assets/', 'https://cdn.prod.website-files.com/');
    if (cdnUrl !== a.hostedUrl) assetMap.set(cdnUrl, assetMap.get(a.hostedUrl));
  }

  // 2. Assets only referenced from the published HTML (hero video transcodes, poster, CMS images).
  const staticPaths = pages
    .filter((p) => !p.collectionId && !p.draft && !p.archived && p.publishedPath)
    .map((p) => p.publishedPath);
  const caseCollection = collections[CASE_STUDY_COLLECTION_SLUG];
  if (!caseCollection) fail(`No "${CASE_STUDY_COLLECTION_SLUG}" collection found.`);
  const itemPaths = caseCollection.items
    .filter((i) => !i.isDraft && !i.isArchived)
    .map((i) => `/${CASE_STUDY_COLLECTION_SLUG}/${i.fieldData.slug}`);
  const liveHtml = {};
  for (const p of [...new Set([...staticPaths, ...itemPaths])]) {
    const res = await fetch(LIVE_ORIGIN + p);
    if (!res.ok) continue;
    const html = await res.text();
    liveHtml[p] = html;
    // Skip Webflow's responsive -p-NNN variants: the new site generates its own sizes.
    for (const m of html.matchAll(CDN_RE)) if (!/-p-\d+\./.test(m[0])) registerAsset(m[0]);
  }

  // 3. Case studies -> Markdown with frontmatter.
  const linkedFiles = new Set();
  await mkdir(CASE_STUDY_DIR, { recursive: true });
  for (const f of await readdir(CASE_STUDY_DIR)) if (f.endsWith('.md')) await unlink(path.join(CASE_STUDY_DIR, f));
  const richFields = caseCollection.fields.filter((f) => f.type === 'RichText').map((f) => camel(f.slug));
  for (const item of caseCollection.items) {
    const fields = mapFields(item, caseCollection);
    const body = richTextToMarkdown(fields.bodyText);
    for (const k of richFields) delete fields[k]; // rich text becomes the Markdown body
    const fm = { ...fields, title: fields.name, status: status(item), ...meta(item) };
    delete fm.name;
    if (fm.blogImage?.src) fm.blogImage.src = toCaseStudyRelative(fm.blogImage.src);
    // Astro only processes Markdown *images*; linked documents (PDF posters) are served as-is
    // from public/files/ and copied there after download.
    const linkedBody = body.replace(/\]\((\/src\/assets\/webflow\/[^)\s]+\.pdf)\)/g, (_, p) => {
      linkedFiles.add(p);
      return `](/files/${p.split('/').pop()})`;
    });
    const file = `---${toYaml(fm)}\n---\n\n${toCaseStudyRelative(linkedBody)}`;
    await writeFile(path.join(CASE_STUDY_DIR, `${item.fieldData.slug}.md`), applyFixes(`case-studies/${item.fieldData.slug}`, file));
  }

  await mkdir(DATA_DIR, { recursive: true });
  // 4. Supporting collections. Unpublished items are kept only when they are visible on
  //    the live site (e.g. testimonials hard-coded into the homepage slider) so that
  //    unpublished drafts never end up in this public repo.
  const liveText = Object.values(liveHtml).join('\n');
  const supporting = { testimonials: 'testimonials', 'team-members': 'team', technologies: 'technologies', 'open-jobs': 'jobs' };
  const supportingCounts = {};
  for (const [slug, outName] of Object.entries(supporting)) {
    const c = collections[slug];
    if (!c) continue;
    const rows = c.items
      .filter((i) => status(i).published || liveText.includes(i.fieldData.name))
      .map((i) => ({ ...mapFields(i, c), status: { ...status(i), visibleOnLiveSite: liveText.includes(i.fieldData.name) }, ...meta(i) }))
      .map((row) => applyFieldOverrides(`${outName}/${row.slug}`, row));
    await writeFile(path.join(DATA_DIR, `${outName}.json`), JSON.stringify(rows, null, 2) + '\n');
    supportingCounts[outName] = { total: c.items.length, exported: rows.length };
  }

  // Every URL the Webflow site served (static pages, incl. drafts that were linked, and each CMS
  // item under its collection template), so scripts/check-redirects.mjs can prove none 404.
  const urls = new Set(pages.filter((p) => !p.collectionId && p.publishedPath).map((p) => p.publishedPath));
  for (const p of pages.filter((p) => p.collectionId && p.publishedPath)) {
    const c = Object.values(collections).find((c) => c.id === p.collectionId);
    urls.add(p.publishedPath);
    for (const i of c?.items ?? []) if (!i.isDraft && !i.isArchived) urls.add(`${p.publishedPath}/${i.fieldData.slug}`);
  }
  await writeFile(path.join(DATA_DIR, 'webflow-urls.json'), JSON.stringify([...urls].sort(), null, 2) + '\n');

  // 5. Download.
  const dl = await downloadAll();
  await mkdir(path.join(ROOT, 'public/files'), { recursive: true });
  for (const p of linkedFiles) await copyFile(path.join(ROOT, p), path.join(ROOT, 'public/files', p.split('/').pop()));
  const manifest = Object.fromEntries([...assetMap.entries()].sort());
  await writeFile(path.join(DATA_DIR, 'webflow-assets.json'), JSON.stringify(manifest, null, 2) + '\n');

  // 6. Form submissions -> CSV (outside the repo).
  const forms = await apiAll(`/sites/${site.id}/forms`, 'forms', 25);
  const submissions = await apiAll(`/sites/${site.id}/form_submissions`, 'formSubmissions', 100);
  const domainById = Object.fromEntries((site.customDomains || []).map((d) => [d.id, d.url]));
  const formById = Object.fromEntries(forms.map((f) => [f.id, f]));
  const responseKeys = [...new Set(submissions.flatMap((s) => Object.keys(s.formResponse || {})))];
  const header = ['id', 'dateSubmitted', 'formId', 'formName', 'formPage', 'formDomain', 'publishedPath', ...responseKeys];
  const lines = [header.map(csvCell).join(',')];
  for (const s of submissions.sort((a, b) => a.dateSubmitted.localeCompare(b.dateSubmitted))) {
    const form = formById[s.formId];
    lines.push(
      [
        s.id,
        s.dateSubmitted,
        s.formId,
        s.displayName,
        form?.pageName,
        domainById[form?.siteDomainId] || (form?.siteDomainId === site.id ? `${site.shortName}.webflow.io` : form?.siteDomainId),
        s.publishedPath,
        ...responseKeys.map((k) => s.formResponse?.[k]),
      ]
        .map(csvCell)
        .join(','),
    );
  }
  const csvPath = path.join(PRIVATE_DIR, `form-submissions-${new Date().toISOString().slice(0, 10)}.csv`);
  await writeFile(csvPath, lines.join('\n') + '\n', { mode: 0o600 });

  // Summary (counts only — no personal data).
  const perForm = Object.fromEntries(forms.map((f) => [f.id, submissions.filter((s) => s.formId === f.id).length]));
  const summary = {
    site: site.id,
    caseStudies: {
      total: caseCollection.items.length,
      published: caseCollection.items.filter((i) => status(i).published).length,
      draft: caseCollection.items.filter((i) => i.isDraft).length,
      archived: caseCollection.items.filter((i) => i.isArchived).length,
    },
    supportingCollections: supportingCounts,
    assets: { siteAssetsApi: assets.length, uniqueUrls: assetMap.size, ...dl, failures: dl.failures.length },
    formSubmissions: { total: submissions.length, perForm, csv: csvPath },
    contentFixes: { applied: fixReport.filter((f) => f.matched).length, unmatched: fixReport.filter((f) => !f.matched) },
  };
  console.log(JSON.stringify(summary, null, 2));
  if (dl.failures.length) {
    console.error('Asset download failures:\n  ' + dl.failures.join('\n  '));
    process.exitCode = 1;
  }
}

main().catch((err) => fail(err.stack || String(err)));
