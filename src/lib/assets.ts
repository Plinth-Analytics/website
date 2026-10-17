import type { ImageMetadata } from 'astro';

// Everything the Webflow export downloaded. Images become ImageMetadata (optimised by
// astro:assets); other files (video, PDF) resolve to a fingerprinted URL.
const images = import.meta.glob<{ default: ImageMetadata }>('/src/assets/webflow/*.{png,jpg,jpeg,webp,gif,svg,avif}', {
  eager: true,
});
const files = import.meta.glob<string>('/src/assets/webflow/*.{mp4,webm,pdf}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const byName = (name: string) => `/src/assets/webflow/${name.replace(/^.*\//, '')}`;

/** Look up an exported image by its path or file name (as written by the export). */
export function webflowImage(path: string | null | undefined): ImageMetadata | undefined {
  if (!path) return undefined;
  return images[path]?.default ?? images[byName(path)]?.default;
}

/** Same, but throw at build time if the file is missing — for images the layout depends on. */
export function requireImage(path: string): ImageMetadata {
  const img = webflowImage(path);
  if (!img) throw new Error(`Missing exported image: ${path}`);
  return img;
}

export function webflowFile(name: string): string {
  const url = files[byName(name)];
  if (!url) throw new Error(`Missing exported file: ${name}`);
  return url;
}
