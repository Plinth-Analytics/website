// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import { SITE_URL } from './src/lib/site.ts';

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'directory' },
  // Keep pages that should not be indexed out of the sitemap.
  integrations: [sitemap({ filter: (page) => !/\/(thank-you|404)\/?$/.test(page) })],
  image: { responsiveStyles: true },
  // Hash-based CSP for every inline script/style Astro emits (delivered as a <meta> tag).
  // Headers a <meta> CSP cannot carry (frame-ancestors etc.) are set in public/_headers.
  security: {
    csp: {
      algorithm: 'SHA-256',
      // Google hosts: GA4 + Google Ads tag (same IDs as the Webflow site), per Google's CSP guide.
      directives: [
        "default-src 'self'",
        "img-src 'self' data: https://*.google-analytics.com https://*.googletagmanager.com https://*.google.com https://*.doubleclick.net https://www.googleadservices.com",
        "font-src 'self'",
        "media-src 'self'",
        "connect-src 'self' https://formspree.io https://*.google-analytics.com https://*.googletagmanager.com https://*.google.com https://*.doubleclick.net https://www.googleadservices.com",
        'frame-src https://*.doubleclick.net https://www.googletagmanager.com',
        "form-action 'self' https://formspree.io",
        "base-uri 'self'",
        "object-src 'none'",
        'upgrade-insecure-requests',
      ],
      scriptDirective: {
        resources: [
          "'self'",
          'https://www.googletagmanager.com',
          'https://googleads.g.doubleclick.net',
          'https://www.googleadservices.com',
        ],
      },
    },
  },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
