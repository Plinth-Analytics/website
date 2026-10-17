import { getCollection, type CollectionEntry } from 'astro:content';

export type CaseStudy = CollectionEntry<'caseStudies'>;

/** Published items, newest first (the order the Webflow listing used). */
export async function getCaseStudies(): Promise<CaseStudy[]> {
  const all = await getCollection('caseStudies', ({ data }) => data.status.published);
  return all.sort(
    (a, b) =>
      b.data.createdOn.getTime() - a.data.createdOn.getTime() ||
      b.data.lastUpdated.getTime() - a.data.lastUpdated.getTime(),
  );
}

export const caseStudyUrl = (entry: CaseStudy) => `/case-studies/${entry.data.slug}`;

export const formatMonth = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });

const strip = (md: string) =>
  md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Split the Markdown body into { heading: firstParagraph } using its #### / ##### headings. */
function sections(body: string) {
  const out = new Map<string, { text: string; anchor: string }>();
  const re = /^#{2,6}\s+(.+)$/gm;
  const heads = [...body.matchAll(re)];
  heads.forEach((m, i) => {
    const start = m.index! + m[0].length;
    const end = heads[i + 1]?.index ?? body.length;
    const firstPara = body
      .slice(start, end)
      .split(/\n\s*\n/)
      .map(strip)
      .find((p) => p.length > 0);
    const title = strip(m[1]);
    if (firstPara) out.set(title.toLowerCase(), { text: firstPara, anchor: slugify(title) });
  });
  return out;
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

const PROBLEM = ['motivation', 'challenge', 'problem'];
const APPROACH = ['solution', 'approach'];
const OUTCOME = ['impact', 'business impact', 'key results', 'outcome'];

/**
 * Problem → approach → outcome, taken verbatim from the case study's own sections, so a
 * summary is only shown when the write-up actually has all three.
 */
export function atAGlance(body: string | undefined) {
  if (!body) return null;
  const s = sections(body);
  const pick = (names: string[]) => names.map((n) => s.get(n)).find(Boolean);
  const problem = pick(PROBLEM);
  const approach = pick(APPROACH);
  const outcome = pick(OUTCOME);
  if (!problem || !approach || !outcome) return null;
  return { problem, approach, outcome };
}

/** Short teaser for cards: CMS short description, else the article's opening sentence(s). */
export function teaser(entry: CaseStudy, max = 180) {
  const src = entry.data.shortDescription ?? sections(entry.body ?? '').values().next().value?.text ?? '';
  const text = strip(src);
  return text.length > max ? text.slice(0, text.lastIndexOf(' ', max)) + '…' : text;
}
