import { mkdir, readFile, writeFile } from 'node:fs/promises';

let apiKey = process.env.TMDB_API_KEY;
if (!apiKey) {
  try {
    apiKey = (await readFile('.env.local', 'utf8')).match(/^TMDB_API_KEY=(.*)$/m)?.[1]?.trim();
  } catch { /* GitHub Actions supplies the key through its secret. */ }
}
if (!apiKey) throw new Error('TMDB_API_KEY is required to build the Pages catalog');

const providers = { Netflix: '8', 'HBO Max': '1899', 'Disney+': '337', 'Prime Video': '119', 'Apple TV+': '350', BluTV: '341' };
const jobs = [
  ...Array.from({ length: 35 }, (_, i) => ({ kind: 'popular', page: i + 1 })),
  ...Array.from({ length: 8 }, (_, i) => ({ kind: 'rated', page: i + 1 })),
  ...Object.entries(providers).flatMap(([platform, provider]) =>
    Array.from({ length: 7 }, (_, i) => ({ kind: 'provider', platform, provider, page: i + 1 }))),
];
const records = new Map();

async function load(job) {
  const url = new URL(`https://api.themoviedb.org/3/${job.kind === 'rated' ? 'tv/top_rated' : 'discover/tv'}`);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('language', 'tr-TR');
  url.searchParams.set('page', String(job.page));
  url.searchParams.set('include_adult', 'false');
  if (job.kind !== 'rated') {
    url.searchParams.set('sort_by', 'popularity.desc');
    url.searchParams.set('without_genres', '10763,10764,10767,10762,16');
  }
  if (job.provider) {
    url.searchParams.set('watch_region', 'TR');
    url.searchParams.set('with_watch_providers', job.provider);
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url);
    if (response.ok) {
      for (const item of (await response.json()).results || []) {
        if (!item.id || !item.poster_path) continue;
        const existing = records.get(item.id);
        records.set(item.id, { ...existing, ...item, platforms: [...new Set([...(existing?.platforms || []), ...(job.platform ? [job.platform] : [])])] });
      }
      return;
    }
    if (response.status !== 429 && response.status < 500) throw new Error(`TMDB catalog request failed: ${response.status}`);
    await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 2000));
  }
  throw new Error('TMDB catalog request failed after retries');
}

for (let i = 0; i < jobs.length; i += 4) await Promise.all(jobs.slice(i, i + 4).map(load));
if (records.size < 100) throw new Error(`Catalog unexpectedly small: ${records.size}`);
await mkdir('public', { recursive: true });
await writeFile('public/archive-catalog.json', JSON.stringify({ updatedAt: new Date().toISOString(), results: [...records.values()] }));
console.log(`Built static Pages catalog with ${records.size} series`);
