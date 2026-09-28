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

const genres = {
  'Aksiyon & Macera': '10759',
  'Animasyon': '16',
  'Komedi': '35',
  'Suç': '80',
  'Belgesel': '99',
  'Drama': '18',
  'Gizem': '9648',
  'Bilim Kurgu & Fantastik': '10765',
  'Savaş & Politik': '10768',
  'Western': '37',
};

async function load(job) {
  const isTopRated = job.kind === 'rated';
  const url = new URL(`https://api.themoviedb.org/3/${isTopRated ? 'tv/top_rated' : 'discover/tv'}`);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('language', 'tr-TR');
  url.searchParams.set('page', String(job.page));
  url.searchParams.set('include_adult', 'false');
  if (!isTopRated) {
    url.searchParams.set('sort_by', 'popularity.desc');
  }
  if (job.genre) {
    url.searchParams.set('with_genres', job.genre);
    url.searchParams.set('vote_count.gte', '20');
  }
  if (job.provider) {
    url.searchParams.set('watch_region', 'TR');
    url.searchParams.set('with_watch_providers', job.provider);
  }
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const payload = await response.json();
        for (const item of payload.results || []) {
          if (!item.id || !item.poster_path || !(item.name || item.original_name)) continue;
          const existing = records.get(item.id);
          records.set(item.id, {
            id: item.id,
            name: item.name,
            original_name: item.original_name,
            poster_path: item.poster_path,
            backdrop_path: item.backdrop_path,
            overview: item.overview ? item.overview.slice(0, 320) : '',
            first_air_date: item.first_air_date,
            vote_average: item.vote_average || 0,
            vote_count: item.vote_count || 0,
            popularity: Math.round(item.popularity || 0),
            genre_ids: item.genre_ids || [],
            platforms: [...new Set([...(existing?.platforms || []), ...(job.platform ? [job.platform] : [])])]
          });
        }
        return;
      }
      if (response.status !== 429 && response.status < 500) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
  }
}

async function batch(jobs) {
  for (let i = 0; i < jobs.length; i += 8) {
    await Promise.all(jobs.slice(i, i + 8).map(load));
  }
}

const jobs = [
  ...Array.from({ length: 80 }, (_, i) => ({ kind: 'popular', page: i + 1 })),
  ...Array.from({ length: 40 }, (_, i) => ({ kind: 'rated', page: i + 1 })),
  ...Object.entries(providers).flatMap(([platform, provider]) =>
    Array.from({ length: 20 }, (_, i) => ({ kind: 'provider', platform, provider, page: i + 1 }))),
  ...Object.entries(genres).flatMap(([, genreId]) =>
    Array.from({ length: 15 }, (_, i) => ({ kind: 'genre', genre: genreId, page: i + 1 }))),
];
await batch(jobs);
if (records.size < 500) throw new Error(`Catalog unexpectedly small: ${records.size}`);
await mkdir('public', { recursive: true });
await writeFile('public/archive-catalog.json', JSON.stringify({ updatedAt: new Date().toISOString(), results: [...records.values()] }));
console.log(`Built static Pages catalog with ${records.size} high-quality series`);
