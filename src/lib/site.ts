// Site-wide settings. Values here are public; nothing secret belongs in this file.

/** Canonical origin. plinth.co (apex) redirects here, as it did on Webflow. */
export const SITE_URL = 'https://www.plinth.co';

export const SITE_NAME = 'Plinth';
export const LEGAL_NAME = 'Plinth Analytics';
export const DEFAULT_TITLE = 'Plinth - Elevate Your Data';
export const DEFAULT_DESCRIPTION =
  'We work at the intersection of Pharma, Real World Data, and Data Science to help our clients drive innovation and deliver impactful solutions.';
export const CONTACT_EMAIL = 'info@plinth.co';
export const LINKEDIN_URL = 'https://www.linkedin.com/company/plinthco/';

/** Locally hosted social card (1200×630). Replaces the old ibb.co link. */
export const OG_IMAGE = { src: '/og/plinth-og.png', width: 1200, height: 630, alt: 'Plinth — Data Elevated' };

/**
 * Analytics carried over from the Webflow site (same public IDs). Set the env vars to an
 * empty string to turn either off.
 */
export const GA_MEASUREMENT_ID = import.meta.env?.PUBLIC_GA_MEASUREMENT_ID ?? 'G-2Q1TKWSXXE';
export const GOOGLE_ADS_ID = import.meta.env?.PUBLIC_GOOGLE_ADS_ID ?? 'AW-16638870571';

/** Formspree form ID (the part after /f/). Configure in Cloudflare Pages env vars. */
export const FORMSPREE_ID = import.meta.env?.PUBLIC_FORMSPREE_ID ?? '';

export const NAV = [
  { href: '/about', label: 'About' },
  { href: '/solutions', label: 'Solutions' },
  { href: '/case-studies', label: 'Case Studies' },
  { href: '/careers', label: 'Careers' },
];
