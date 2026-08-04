/**
 * Content access layer.
 *
 * Every page reads its CMS content through here. When `STRAPI_URL` is set the
 * data comes from Strapi at build time; otherwise — or if Strapi is unreachable
 * — the JSON snapshot in `src/data` is used, so the theme always builds after a
 * plain `git clone && npm install`.
 */
import featuresFallback from '../data/features.json';
import portfoliosFallback from '../data/portfolios.json';

export interface Feature {
  slug: string;
  title: string;
  summary: string;
  icon: string;
  detailsTitle: string;
  detailsSummary: string;
  detailsText: string;
  processingSpeed: string;
  averageResponseTime: string;
  concurrentUsers: string;
  accuracyRate: string;
  publishedAt: string;
}

export interface Portfolio {
  slug: string;
  title: string;
  summary: string;
  thumbnail: string;
  solutions: string;
  tool: string;
  location: string;
  client: string;
  detailsImage1: string;
  detailsImage2: string;
  detailsImage3: string;
  detailsText: string;
  keyPoints: string[];
  challenge: string;
  solution: string;
  publishedAt: string;
}

const STRAPI_URL = (import.meta.env.STRAPI_URL ?? '').replace(/\/$/, '');
const STRAPI_TOKEN = import.meta.env.STRAPI_TOKEN ?? '';

/** Strapi returns media as a relative `/uploads/...` path; make it absolute. */
function mediaUrl(media: unknown): string {
  if (!media) return '';
  const node = media as Record<string, any>;
  const url: string = node.url ?? node.data?.attributes?.url ?? node.attributes?.url ?? '';
  if (!url) return '';
  return /^https?:\/\//.test(url) ? url : STRAPI_URL + url;
}

/** Strapi v5 returns flat entries; v4 nests them under `attributes`. */
const flatten = (entry: Record<string, any>) => ({ ...entry, ...(entry.attributes ?? {}) });

async function fetchCollection(endpoint: string): Promise<Record<string, any>[] | null> {
  if (!STRAPI_URL) return null;
  const url = `${STRAPI_URL}/api/${endpoint}?populate=*&pagination[pageSize]=100&sort=publishedAt:asc`;
  try {
    const res = await fetch(url, {
      headers: STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {},
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const json = await res.json();
    if (!Array.isArray(json?.data)) throw new Error('unexpected response shape');
    return json.data.map(flatten);
  } catch (err) {
    console.warn(
      `[content] Strapi unavailable for "${endpoint}" (${(err as Error).message}) - using the bundled snapshot in src/data.`,
    );
    return null;
  }
}

export async function getFeatures(): Promise<Feature[]> {
  const rows = await fetchCollection('features');
  if (!rows) return featuresFallback as Feature[];
  return rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    summary: r.summary ?? '',
    icon: mediaUrl(r.icon) || r.icon || '',
    detailsTitle: r.detailsTitle ?? '',
    detailsSummary: r.detailsSummary ?? '',
    detailsText: r.detailsText ?? '',
    processingSpeed: r.processingSpeed ?? '',
    averageResponseTime: r.averageResponseTime ?? '',
    concurrentUsers: r.concurrentUsers ?? '',
    accuracyRate: r.accuracyRate ?? '',
    publishedAt: r.publishedAt ?? '',
  }));
}

export async function getPortfolios(): Promise<Portfolio[]> {
  const rows = await fetchCollection('portfolios');
  if (!rows) return portfoliosFallback as Portfolio[];
  return rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    summary: r.summary ?? '',
    thumbnail: mediaUrl(r.thumbnail) || r.thumbnail || '',
    solutions: r.solutions ?? '',
    tool: r.tool ?? '',
    location: r.location ?? '',
    client: r.client ?? '',
    detailsImage1: mediaUrl(r.detailsImage1) || r.detailsImage1 || '',
    detailsImage2: mediaUrl(r.detailsImage2) || r.detailsImage2 || '',
    detailsImage3: mediaUrl(r.detailsImage3) || r.detailsImage3 || '',
    detailsText: r.detailsText ?? '',
    keyPoints: Array.isArray(r.keyPoints) ? r.keyPoints : (r.keyPoints?.split?.('\n').filter(Boolean) ?? []),
    challenge: r.challenge ?? '',
    solution: r.solution ?? '',
    publishedAt: r.publishedAt ?? '',
  }));
}

export async function getFeature(slug: string) {
  return (await getFeatures()).find((f) => f.slug === slug);
}

export async function getPortfolio(slug: string) {
  return (await getPortfolios()).find((p) => p.slug === slug);
}

/**
 * Splits a heading so the trailing words can be wrapped in the theme's
 * highlight span, matching the two-tone section titles in the design.
 */
export function splitHeading(text: string, highlightWords = 3): [string, string] {
  const words = (text ?? '').trim().split(/\s+/);
  if (words.length <= highlightWords) return ['', words.join(' ')];
  const head = words.slice(0, words.length - highlightWords).join(' ');
  return [head + ' ', words.slice(-highlightWords).join(' ')];
}
