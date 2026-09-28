import { mkdir, readFile, writeFile } from 'node:fs/promises';

let apiKey = process.env.TMDB_API_KEY;
if (!apiKey) {
  try {
    apiKey = (await readFile('.env.local', 'utf8')).match(/^TMDB_API_KEY=(.*)$/m)?.[1]?.trim();
  } catch { /* GitHub Actions supplies the key through its secret. */ }
}
if (!apiKey) throw new Error('TMDB_API_KEY is required to build the Pages catalog');

const providers = { Netflix: '8', 'HBO Max': '1899', 'Disney+': '337', 'Prime Video': '119', 'Apple TV+': '350', BluTV: '341' };
const records = new Map();
const currentYear = new Date().getUTCFullYear();

async function load(job) {
  const url = new URL('https://api.themoviedb.org/3/discover/tv');
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('language', 'tr-TR');
  url.searchParams.set('page', String(job.page));
  url.searchParams.set('include_adult', 'false');
  url.searchParams.set('sort_by', 'popularity.desc');
  if (job.year) {
    url.searchParams.set('first_air_date.gte', `${job.year}-01-01`);
    url.searchParams.set('first_air_date.lte', `${job.year}-12-31`);
  }
  if (job.provider) {
    url.searchParams.set('watch_region', 'TR');
    url.searchParams.set('with_watch_providers', job.provider);
  }
  for (let attempt = 0; attempt < 6; attempt++) {
    const response = await fetch(url);
    if (response.ok) {
      const payload = await response.json();
      for (const item of payload.results || []) {
        if (!item.id || !(item.name || item.original_name)) continue;
        const existing = records.get(item.id);
        records.set(item.id, { ...existing, ...item, platforms: [...new Set([...(existing?.platforms || []), ...(job.platform ? [job.platform] : [])])] });
      }
      return Math.min(500, payload.total_pages || 0);
    }
    if (response.status !== 429 && response.status < 500) throw new Error(`TMDB catalog request failed: ${response.status}`);
    await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1500));
  }
  throw new Error('TMDB catalog request failed after retries');
}

async function batch(jobs) {
  for (let i = 0; i < jobs.length; i += 6) {
    await Promise.all(jobs.slice(i, i + 6).map(load));
    if (i && i % 300 === 0) console.log(`Fetched ${i}/${jobs.length} pages; ${records.size} unique series`);
  }
}

const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => 1900 + i);
const yearlyPages = [];
for (let i = 0; i < years.length; i += 6) {
  yearlyPages.push(...await Promise.all(years.slice(i, i + 6).map(async year => ({ year, pages: await load({ year, page: 1 }) }))));
}
const jobs = [
  ...Array.from({ length: 500 }, (_, i) => ({ page: i + 1 })),
  ...yearlyPages.flatMap(({ year, pages }) => Array.from({ length: Math.min(50, pages) - 1 }, (_, i) => ({ year, page: i + 2 }))),
  ...Object.entries(providers).flatMap(([platform, provider]) =>
    Array.from({ length: 12 }, (_, i) => ({ platform, provider, page: i + 1 }))),
];
await batch(jobs);
if (records.size < 10000) throw new Error(`Catalog unexpectedly small: ${records.size}`);
await mkdir('public', { recursive: true });
await writeFile('public/archive-catalog.json', JSON.stringify({ updatedAt: new Date().toISOString(), results: [...records.values()] }));
console.log(`Built static Pages catalog with ${records.size} series`);
