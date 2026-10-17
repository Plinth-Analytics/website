# plinth.co

The Plinth Analytics website: a static [Astro](https://astro.build) site, deployed to Cloudflare Pages.
It replaces the Webflow site; content was exported with `scripts/export-webflow.mjs`.

## Develop

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # static output in dist/
npm run preview    # serve dist/
```

Requires Node ≥ 22.22 (see `.node-version`).

## Deploy (Cloudflare Pages)

| Setting                | Value           |
| ---------------------- | --------------- |
| Framework preset       | Astro           |
| Build command          | `npm run build` |
| Build output directory | `dist`          |
| Node version           | from `.node-version` |

Environment variables (Production **and** Preview):

| Variable                   | Purpose                                                                 |
| -------------------------- | ----------------------------------------------------------------------- |
| `PUBLIC_FORMSPREE_ID`      | Formspree form ID (the part after `https://formspree.io/f/`). Without it the contact form shows an email link instead. |
| `PUBLIC_GA_MEASUREMENT_ID` | Optional. Defaults to the GA4 ID the Webflow site used; set empty to disable. |
| `PUBLIC_GOOGLE_ADS_ID`     | Optional. Defaults to the Google Ads tag the Webflow site used; set empty to disable. |

`public/_redirects` maps every old Webflow URL to its new home and `public/_headers` sets security
and cache headers. The page Content-Security-Policy (with hashes for inline scripts) is generated
by Astro from `security.csp` in `astro.config.mjs` — add any new third-party host there.

## Content

| What                    | Where                                  |
| ----------------------- | -------------------------------------- |
| Case studies            | `src/content/case-studies/*.md` (one file per Webflow "Stories" item; frontmatter keeps every CMS field plus draft/archived status) |
| Testimonials, team, technologies, jobs | `src/data/*.json`       |
| Solutions (Forge, Fulcrum, …) | `src/data/solutions.ts`          |
| Page copy               | `src/pages/*.astro`                    |
| Images, video, PDFs     | `src/assets/webflow/` (optimised at build time) and `public/` |

To add a case study, add a Markdown file with the same frontmatter as the existing ones.

## Re-running the Webflow export

Only needed while Webflow is still the source of truth.

```sh
WEBFLOW_API_TOKEN=… PRIVATE_EXPORT_DIR=../webflow-private-export npm run export:webflow
```

The script uses the Webflow Data API v2 (the Webflow CLI cannot export CMS items, assets or form
submissions). It rewrites `src/content/case-studies/`, `src/data/*.json` and downloads assets into
`src/assets/webflow/`, then re-applies the copy fixes in `scripts/content-fixes.mjs`.

**Form submissions are personal data.** The script writes them as CSV (and raw API dumps) to
`PRIVATE_EXPORT_DIR`, refuses any path inside the repo, and the usual export folders are
gitignored as a backstop. Never commit them.

## Checks

```sh
npm run build
npm run check:links      # every internal href/src/srcset and #anchor resolves
npm run check:redirects  # every old Webflow URL resolves via a page or _redirects
npm run check:dist       # no Webflow/ibb.co/staging URLs or stale copyright; token scan if WEBFLOW_API_TOKEN is set
npm run preview & npm run check:a11y   # axe-core WCAG 2.2 AA, console/CSP errors, contact form states
```

## Licences

Figtree is used under the SIL Open Font License (`public/fonts/OFL-Figtree.txt`). The Clash
Display font used by the Webflow site is downloaded by the export but deliberately not committed
or used (Indian Type Foundry, all rights reserved). The homepage video is from Pexels.
