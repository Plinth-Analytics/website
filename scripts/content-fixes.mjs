// Copy fixes applied by export-webflow.mjs on top of the raw Webflow CMS content, so a
// re-export keeps them. Each fix must still match; the export warns when one no longer does
// (e.g. it was also fixed in Webflow, or the source text changed).
//
//   target: "case-studies/<slug>" (whole Markdown file) or "<data file>/<item slug>"
//   kind:   "typo" fixes are listed in the PR; "link" / "format" / "override" are other fixes.

export default [
  // ---------------------------------------------------------------- case studies
  {
    target: 'case-studies/capturing-shared-knowledge-for-the-long-term-software-frameworks-that-grow-with-your-team',
    kind: 'typo',
    find: 'benefit from each others’ expertise',
    replace: 'benefit from each other’s expertise',
  },
  {
    target: 'case-studies/streamlining-scientific-visualization-a-flexible-approach-to-treatment-sequence-diagrams',
    kind: 'typo',
    find: 'use a single well developed function, to report results',
    replace: 'use a single well-developed function to report results',
  },
  {
    target: 'case-studies/rwd-cohort-builder',
    kind: 'format',
    // Copy was pasted from a PDF, so sentences are split into separate paragraphs mid-line.
    find: /([^.!?:\n])\n\n(?=[a-z])/g,
    replace: '$1 ',
  },
  {
    target: 'case-studies/rwd-cohort-builder',
    kind: 'typo',
    find: 'An industry leading provider of patient-centered real world data, needed tools to generate bespoke patient cohorts.',
    replace: 'An industry-leading provider of patient-centered real-world data needed tools to generate bespoke patient cohorts.',
  },
  {
    target: 'case-studies/rwd-cohort-builder',
    kind: 'typo',
    find: 'Both coders (quantitative scientists and engineers) and non-coders (commercial and marketing) users.',
    replace: 'Users included both coders (quantitative scientists and engineers) and non-coders (commercial and marketing).',
  },
  {
    target: 'case-studies/rwd-cohort-builder',
    kind: 'typo',
    find: 'to generate a bespoke one-row-per-patient cohorts',
    replace: 'to generate bespoke one-row-per-patient cohorts',
  },
  {
    target: 'case-studies/rwd-cohort-builder',
    kind: 'format',
    // U+F07C6 is a private-use icon-font glyph; it renders as an empty box in every browser.
    find: '\u{f07c6} 0 Lines of code',
    replace: '0 lines of code',
  },
  {
    target: 'case-studies/rwd-cleaning-and-harmonization',
    kind: 'format',
    // Copy was pasted from a PDF, so sentences are split into separate paragraphs mid-line.
    find: /([^.!?:\n])\n\n(?=[a-z])/g,
    replace: '$1 ',
  },
  {
    target: 'case-studies/rwd-cleaning-and-harmonization',
    kind: 'typo',
    find: 'the clients’ database',
    replace: 'the client’s database',
  },
  {
    target: 'case-studies/rwd-cleaning-and-harmonization',
    kind: 'typo',
    find: 'define company specific business logic',
    replace: 'define company-specific business logic',
  },
  {
    target: 'case-studies/deriving-robust-insights-from-rwd',
    kind: 'format',
    find: 'Alice Walsh  \n(Pathos)',
    replace: 'Alice Walsh (Pathos)',
  },
  {
    target: 'case-studies/publications',
    kind: 'typo',
    find: 'POP- REFINE: A Comprehensive Framework forEvaluating',
    replace: 'POP-REFINE: A Comprehensive Framework for Evaluating',
  },
  {
    target: 'case-studies/publications',
    kind: 'format',
    // An empty link (no text) that screen readers announce as a bare URL.
    find: /^\[\]\([^)]*\)\n+/m,
    replace: '',
  },
  {
    target: 'case-studies/publications',
    kind: 'link',
    // The live link is a pre-signed ScienceDirect S3 URL that expired 300 s after it was
    // generated in 2024 and embeds a (now expired) temporary AWS session token. Point at the
    // article's stable page instead (same PII as in the signed URL).
    find: /\(https:\/\/pdf\.sciencedirectassets\.com\/[^)\s]*S109671922400235X[^)\s]*\)/,
    replace: '(https://www.sciencedirect.com/science/article/pii/S109671922400235X)',
  },

  // ------------------------------------------------------------ testimonials
  // These three CMS items are unpublished drafts whose job titles were edited after the live
  // homepage slider was built. Keep the title visitors currently see on plinth.co.
  {
    target: 'testimonials/lisa-lau',
    kind: 'override',
    field: 'jobTitle',
    replace: 'Cancer Epidemiologist | RWE Data Scientist at AstraZeneca',
  },
  {
    target: 'testimonials/ping-sun',
    kind: 'override',
    field: 'jobTitle',
    replace: 'Director RWE Data Scientist at AstraZeneca',
  },
  {
    target: 'testimonials/victoria-devincenzo',
    kind: 'override',
    field: 'jobTitle',
    replace: 'MS, MB (ASCP) | Director of Clinical Research at Picnic Health',
  },
];
