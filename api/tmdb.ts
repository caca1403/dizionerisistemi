/** Vercel-only TMDB proxy. Keys remain on the server; the browser receives only the requested page. */
const moodGenres: Record<string, string> = {
  'Zihin Yakan': '9648|10765', 'Distopya': '10765', 'Karanlık/Gerilim': '80|9648',
  'Siberpunk/Teknoloji': '10765', 'Politik/Güç': '10768', 'Melankolik': '18',
  'Yüksek Adrenalin': '10759', 'Konfor/Rahatlatıcı': '35|10751',
};
const genreIds: Record<string, string> = { 'Aksiyon & Macera':'10759', Animasyon:'16', Belgesel:'99', 'Bilim Kurgu & Fantastik':'10765', Drama:'18', Gizem:'9648', Komedi:'35', Suç:'80', 'Savaş & Politik':'10768', Aile:'10751' };
const providerIds: Record<string, string> = { Netflix:'8', 'HBO Max':'1899', 'Disney+':'337', 'Prime Video':'119', 'Apple TV+':'350', BluTV:'341', Tümü:'' };
export default async function handler(request: any, response: any) {
  const query = String(request.query?.q || '').trim();
  const detailId = Math.max(0, Number(request.query?.id || 0));
  const recommendationsId = Math.max(0, Number(request.query?.recommendations || 0));
  const similarId = Math.max(0, Number(request.query?.similar || 0));
  const providers = String(request.query?.providers || '') === '1';
  const mode = String(request.query?.mode || 'match');
  const mood = String(request.query?.mood || 'Tümü');
  const genre = String(request.query?.genre || 'Tümü');
  const platform = String(request.query?.platform || 'Tümü');
  const status = String(request.query?.status || 'Tümü');
  const page = Math.max(1, Math.min(500, Number(request.query?.page || 1)));
  const apiKey = process.env.TMDB_API_KEY;
  const bearer = process.env.TMDB_BEARER_TOKEN;
  if (!apiKey && !bearer) return response.status(503).json({ results: [], configured: false });
  const isDirectSeries = detailId || recommendationsId || similarId;
  const endpoint = detailId ? (providers ? `tv/${detailId}/watch/providers` : `tv/${detailId}`) : recommendationsId ? `tv/${recommendationsId}/recommendations` : similarId ? `tv/${similarId}/similar` : query.length >= 2 ? 'search/tv' : mode === 'rating' ? 'tv/top_rated' : mode === 'newest' ? 'tv/on_the_air' : 'discover/tv';
  const url = new URL(`https://api.themoviedb.org/3/${endpoint}`);
  url.searchParams.set('language', 'tr-TR'); url.searchParams.set('page', String(page)); url.searchParams.set('include_adult', 'false');
  if (detailId && !providers) { url.searchParams.set('append_to_response', 'credits,videos'); url.searchParams.set('include_video_language', 'tr,en,null,de,fr,es,it,ja,ko'); }
  if (query.length >= 2) url.searchParams.set('query', query);
  if (endpoint === 'discover/tv') {
    const values = [moodGenres[mood], genreIds[genre]].filter(Boolean);
    if (values.length) url.searchParams.set('with_genres', values.join(','));
    if (providerIds[platform]) { url.searchParams.set('watch_region', 'TR'); url.searchParams.set('with_watch_providers', providerIds[platform]); }
    if (status === 'Ended') url.searchParams.set('with_status', '3');
    if (status === 'Continuing') url.searchParams.set('with_status', '0|1|2');
    
    // Haber, reality, talk show ve çocuk çizgi filmlerini dizi aramasından ayıkla
    const excluded = ['10763', '10764', '10767', '10762'];
    if (genre !== 'Animasyon') {
      excluded.push('16');
    }
    url.searchParams.set('without_genres', excluded.join(','));
    url.searchParams.set('sort_by', 'popularity.desc');
  }
  if (apiKey) url.searchParams.set('api_key', apiKey);
  try {
    const upstream = await fetch(url, { headers: bearer ? { Authorization: `Bearer ${bearer}` } : undefined });
    if (!upstream.ok) return response.status(upstream.status).json({ results: [] });
    const payload = await upstream.json();
    response.setHeader('Cache-Control', query ? 's-maxage=300, stale-while-revalidate=3600' : 's-maxage=900, stale-while-revalidate=21600');
    return response.status(200).json(payload);
  } catch { return response.status(502).json({ results: [] }); }
}
