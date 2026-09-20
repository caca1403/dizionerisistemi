import type { ArchiveRankMode, Filters, TVSeries } from '../types';
import { setRuntimeStatus } from '../lib/runtimeStatus';
const image = 'https://image.tmdb.org/t/p/w342'; const backdrop = 'https://image.tmdb.org/t/p/w780';
const genres: Record<number,string> = {16:'Animasyon',18:'Drama',35:'Komedi',80:'Suç',99:'Belgesel',9648:'Gizem',10751:'Aile',10759:'Aksiyon & Macera',10762:'Çocuk',10765:'Bilim Kurgu & Fantastik',10768:'Savaş & Politik'};
const memory = new Map<string, { expires: number; data: TMDBPage }>();
const detailMemory = new Map<string, { expires: number; data: TMDBDetails; providers?: TMDBWatchProviders }>();
type TMDBResult = { id:number; name?:string; original_name?:string; overview?:string; first_air_date?:string; poster_path?:string|null; backdrop_path?:string|null; vote_average?:number; vote_count?:number; popularity?:number; genre_ids?:number[] };
type TMDBPage = { results: TMDBResult[]; total_results: number; total_pages: number; configured?: boolean };
type TMDBDetails = TMDBResult & {
  status?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  genres?: { id: number; name: string }[];
  networks?: { name: string }[];
  credits?: { cast?: { id: number; name: string; character?: string; profile_path?: string | null }[] };
  videos?: { results?: { key: string; site: string; type: string; official?: boolean; name: string }[] };
};
type TMDBWatchProviders = { results?: { TR?: { link?: string; flatrate?: { provider_name: string }[] } } };
const supportedProviders: Record<string, TVSeries['platforms'][number]> = { Netflix:'Netflix', 'HBO Max':'HBO Max', Max:'HBO Max', 'Disney Plus':'Disney+', 'Disney+':'Disney+', 'Amazon Prime Video':'Prime Video', 'Prime Video':'Prime Video', 'Apple TV Plus':'Apple TV+', 'Apple TV+':'Apple TV+', BluTV:'BluTV' };
const inferMoods = (value: string): TVSeries['moodTags'] => {
  const text = value.toLocaleLowerCase('tr-TR');
  const tags: TVSeries['moodTags'] = [];
  if (/(?<![a-zçğıöşü])(gizem|zaman döngüsü|zaman yolculuğu|psikolojik|hafıza|kimlik|sırlar|sırrı|sır|paradoks|tekinsiz)(?![a-zçğıöşü])/i.test(text)) tags.push('Zihin Yakan');
  if (/(?<![a-zçğıöşü])(gerilim|suç|cinayet|katil|korku|tehlike|polisiye|soruşturma|dedektif)(?![a-zçğıöşü])/i.test(text)) tags.push('Karanlık/Gerilim');
  if (/(?<![a-zçğıöşü])(distopya|kıyamet|felaket|totaliter|baskıcı rejim)(?![a-zçğıöşü])/i.test(text)) tags.push('Distopya');
  if (/(?<![a-zçğıöşü])(teknoloji|siber|hacker|gelecek|robot|yapay zeka|bilim kurgu)(?![a-zçğıöşü])/i.test(text)) tags.push('Siberpunk/Teknoloji');
  if (/(?<![a-zçğıöşü])(politika|güç savaşı|iktidar|hanedan|entrika|hükümet|mahkeme|şirket)(?![a-zçğıöşü])/i.test(text)) tags.push('Politik/Güç');
  if (/(?<![a-zçğıöşü])(komedi|aile|arkadaş|arkadaşlık|mizah|eğlence|kahkaha|sıcak|rahat)(?![a-zçğıöşü])/i.test(text)) tags.push('Konfor/Rahatlatıcı');
  if (/(?<![a-zçğıöşü])(aksiyon|macera|adrenalin|kovalamaca|hayatta kalma|kaçış)(?![a-zçğıöşü])/i.test(text)) tags.push('Yüksek Adrenalin');
  if (/(?<![a-zçğıöşü])(hüzün|dram|yas|yalnızlık|melankoli|ayrılık|aşk)(?![a-zçğıöşü])/i.test(text)) tags.push('Melankolik');
  return tags.length ? tags : ['Melankolik'];
};
const turkishOverview = (overview?: string) => {
  const copy = overview?.trim() || '';
  return copy || 'Bu yapım için henüz özet eklenmemiş.';
};
export const mapTMDB=(item:TMDBResult, selectedPlatform: TVSeries['platforms'][number] | 'Tümü' = 'Tümü'):TVSeries|null=>{
  const title=item.name||item.original_name;
  if(!title||!item.poster_path)return null;
  const rawGenreIds = item.genre_ids || [];
  // Haber, reality, talk show ve küçük çocuk çizgi filmlerini arşive katma
  if (rawGenreIds.some(id => id === 10763 || id === 10764 || id === 10767 || id === 10762)) return null;
  const itemGenres=rawGenreIds.map(id=>genres[id]).filter(Boolean);
  const synopsis=turkishOverview(item.overview);
  const moods=inferMoods(`${title} ${synopsis} ${itemGenres.join(' ')}`);
  return{
    id:`tmdb-${item.id}`,
    title,
    originalTitle:item.original_name||title,
    posterUrl:image+item.poster_path,
    backdropUrl:item.backdrop_path?backdrop+item.backdrop_path:image+item.poster_path,
    releaseYear:Number(item.first_air_date?.slice(0,4))||0,
    status:'Continuing',
    seasonsCount:0,
    totalEpisodes:0,
    imdbRating:Math.round((item.vote_average||0)*10)/10,
    matchScore:0,
    platforms:selectedPlatform==='Tümü'?[]:[selectedPlatform],
    genres:itemGenres.length?itemGenres:['Dizi'],
    moodTags:moods,
    emotionProfile:{mystery:moods.includes('Zihin Yakan')?78:48,psychological:moods.includes('Melankolik')?68:48,pacing:moods.includes('Karanlık/Gerilim')?72:56,humor:moods.includes('Konfor/Rahatlatıcı')?67:25,complexity:moods.includes('Zihin Yakan')?80:54},
    synopsis,
    aiRecommendationReason:'Seçtiğin rota ve yapım verilerinin ortak sinyalleriyle sıralandı.',
    similarSeriesIds:[],
    cast:[],
    deepLinkUrl:'',
    trailerUrl:`https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} official trailer`)}`,
    posterCNN:{dominantColors:['#283344','#8391A7','#D7E1EE'],visualMood:'Henüz analiz edilmedi',lightingContrast:'Medium'},
    dataSource:'TMDB',
    popularity:item.popularity||0,
    voteCount:item.vote_count||0
  };
};
export async function getTMDBPage(filters: Filters, mode: ArchiveRankMode, page: number, signal?: AbortSignal) {const params=new URLSearchParams({mode,page:String(page+1),mood:filters.mood,genre:filters.genre,platform:filters.platform,status:filters.status});if(filters.query.trim())params.set('q',filters.query.trim());const key=params.toString();const cached=memory.get(key);if(cached&&cached.expires>Date.now())return cached.data;const response=await fetch(`/api/tmdb?${key}`,{signal});if(!response.ok){setRuntimeStatus('tmdb','failed');throw new Error('TMDB yanıt vermedi');}const data=await response.json() as TMDBPage;setRuntimeStatus('tmdb','ready');memory.set(key,{data,expires:Date.now()+5*60_000});return data;}
export async function searchLiveTMDB(query:string, signal?:AbortSignal){if(query.trim().length<2)return [];const data=await getTMDBPage({mood:'Tümü',genre:'Tümü',platform:'Tümü',minRating:0,status:'Tümü',pacing:[0,100],complexity:[0,100],query},'match',0,signal);return data.results.map(item=>mapTMDB(item)).filter((item):item is TVSeries=>Boolean(item)).slice(0,8);}

const mockTmdbMap: Record<string, string> = {
  'ted-lasso': '97546',
  'mr-robot': '62560',
  'dark': '70523',
  'severance': '95396',
  'succession': '76331',
  'true-detective': '46648',
  'black-mirror': '42009',
  'person-of-interest': '1411',
  'the-bear': '136315',
  'mindhunter': '67744',
  'sherlock': '19885',
  'breaking-bad': '1396',
  'narcos': '63351',
  'better-call-saul': '60059',
  'ozark': '69740',
  'peaky-blinders': '60574',
  'the-sopranos': '1398',
  'the-wire': '1438',
  'game-of-thrones': '1399',
  'the-last-of-us': '100088',
  'prison-break': '2288',
  'the-expanse': '63639',
};

export async function resolveTmdbId(series: TVSeries | string, signal?: AbortSignal): Promise<string | null> {
  const idStr = typeof series === 'string' ? series : series.id;
  if (mockTmdbMap[idStr]) return mockTmdbMap[idStr];
  const match = /^tmdb-(\d+)$/.exec(idStr);
  if (match) return match[1];
  if (/^\d+$/.test(idStr)) return idStr;
  if (typeof series !== 'string') {
    try {
      const q = encodeURIComponent(series.originalTitle || series.title);
      const res = await fetch(`/api/tmdb?q=${q}`, { signal });
      if (res.ok) {
        const data = await res.json() as TMDBPage;
        if (data.results?.[0]?.id) return String(data.results[0].id);
      }
    } catch {
      return null;
    }
  }
  return null;
}

function getTmdbId(series: TVSeries) {
  if (mockTmdbMap[series.id]) return mockTmdbMap[series.id];
  const match = /^tmdb-(\d+)$/.exec(series.id);
  return match ? match[1] : (/^\d+$/.test(series.id) ? series.id : null);
}

function hydrateSeries(series: TVSeries, detail: TMDBDetails, providers?: TMDBWatchProviders): TVSeries {
  const title = detail.name || detail.original_name || series.title;
  const detailGenres = detail.genres?.map(genre => genre.name).filter(Boolean);
  const cast = (detail.credits?.cast || []).slice(0, 14).map(member => ({
    id: `tmdb-cast-${member.id}`,
    name: member.name,
    character: member.character || 'Oyuncu',
    avatarUrl: member.profile_path ? `https://image.tmdb.org/t/p/w185${member.profile_path}` : undefined,
  }));
  const trProviders = providers?.results?.TR;
  const platforms = [...new Set((trProviders?.flatrate || []).map(provider => supportedProviders[provider.provider_name]).filter((provider): provider is TVSeries['platforms'][number] => Boolean(provider)))];
  const videos = detail.videos?.results || [];
  const video = videos.find(item => item.site === 'YouTube' && item.type === 'Trailer' && item.official)
    || videos.find(item => item.site === 'YouTube' && item.type === 'Trailer')
    || videos.find(item => item.site === 'YouTube' && item.type === 'Teaser')
    || videos.find(item => item.site === 'YouTube' && item.official)
    || videos.find(item => item.site === 'YouTube' && (item.type === 'Clip' || item.type === 'Featurette'))
    || videos.find(item => item.site === 'YouTube');
  return {
    ...series,
    title,
    originalTitle: detail.original_name || series.originalTitle,
    synopsis: turkishOverview(detail.overview) === 'Bu yapım için Türkçe özet henüz TMDB arşivine eklenmemiş.' ? series.synopsis : turkishOverview(detail.overview),
    backdropUrl: detail.backdrop_path ? backdrop + detail.backdrop_path : series.backdropUrl,
    posterUrl: detail.poster_path ? image + detail.poster_path : series.posterUrl,
    releaseYear: Number(detail.first_air_date?.slice(0, 4)) || series.releaseYear,
    status: detail.status === 'Ended' ? 'Ended' : 'Continuing',
    seasonsCount: detail.number_of_seasons ?? series.seasonsCount,
    totalEpisodes: detail.number_of_episodes ?? series.totalEpisodes,
    imdbRating: Math.round((detail.vote_average || series.imdbRating) * 10) / 10,
    genres: detailGenres?.length ? detailGenres : series.genres,
    cast: cast.length ? cast : series.cast,
    platforms: platforms.length ? platforms : series.platforms,
    deepLinkUrl: trProviders?.link || series.deepLinkUrl,
    trailerUrl: video ? `https://www.youtube-nocookie.com/embed/${video.key}?autoplay=1&rel=0` : series.trailerUrl,
    aiRecommendationReason: `${series.aiRecommendationReason} Yapım dosyası canlı TMDB ayrıntılarıyla tamamlandı.`,
  };
}

/** Fetches only the opened dossier's credits and metadata; feed cards stay lightweight. */
export async function getTMDBDetails(series: TVSeries, signal?: AbortSignal): Promise<TVSeries> {
  const id = getTmdbId(series);
  if (!id) return series;
  const cached = detailMemory.get(id);
  if (cached && cached.expires > Date.now()) return hydrateSeries(series, cached.data, cached.providers);
  const [detailResponse, providerResponse] = await Promise.all([
    fetch(`/api/tmdb?id=${id}`, { signal }),
    fetch(`/api/tmdb?id=${id}&providers=1`, { signal }),
  ]);
  if (!detailResponse.ok) throw new Error('TMDB yapım dosyası yanıt vermedi');
  const detail = await detailResponse.json() as TMDBDetails;
  const providers = providerResponse.ok ? await providerResponse.json() as TMDBWatchProviders : undefined;
  detailMemory.set(id, { data: detail, providers, expires: Date.now() + 30 * 60_000 });
  return hydrateSeries(series, detail, providers);
}

/** Fetches real worldwide similar / recommended series from TMDB */
export async function getTMDBRecommendations(
  seriesId: string,
  pageOrSignal: number | AbortSignal = 1,
  maybeSignal?: AbortSignal
): Promise<TVSeries[]> {
  const page = typeof pageOrSignal === 'number' ? pageOrSignal : 1;
  const signal = typeof pageOrSignal === 'number' ? maybeSignal : pageOrSignal;
  const tmdbId = mockTmdbMap[seriesId] || (/^tmdb-(\d+)$/.exec(seriesId)?.[1]) || (/^\d+$/.test(seriesId) ? seriesId : null);
  if (!tmdbId) return [];
  try {
    const response = await fetch(`/api/tmdb?recommendations=${tmdbId}&page=${page}`, { signal });
    if (!response.ok) return [];
    const data = await response.json() as TMDBPage;
    return (data.results || []).map(item => mapTMDB(item)).filter((item): item is TVSeries => Boolean(item));
  } catch {
    return [];
  }
}

/** Fetches similar series from TMDB */
export async function getTMDBSimilar(
  seriesId: string,
  pageOrSignal: number | AbortSignal = 1,
  maybeSignal?: AbortSignal
): Promise<TVSeries[]> {
  const page = typeof pageOrSignal === 'number' ? pageOrSignal : 1;
  const signal = typeof pageOrSignal === 'number' ? maybeSignal : pageOrSignal;
  const tmdbId = mockTmdbMap[seriesId] || (/^tmdb-(\d+)$/.exec(seriesId)?.[1]) || (/^\d+$/.test(seriesId) ? seriesId : null);
  if (!tmdbId) return [];
  try {
    const response = await fetch(`/api/tmdb?similar=${tmdbId}&page=${page}`, { signal });
    if (!response.ok) return [];
    const data = await response.json() as TMDBPage;
    return (data.results || []).map(item => mapTMDB(item)).filter((item): item is TVSeries => Boolean(item));
  } catch {
    return [];
  }
}

/** Multi-reference intelligent recommendation aggregator for Lab 01 */
export async function fetchMultiReferenceRecommendations(
  references: TVSeries[],
  page = 0,
  signal?: AbortSignal
): Promise<TVSeries[]> {
  if (!references.length) return [];
  
  const referenceIds = new Set<string>();
  const referenceTitles = new Set<string>();
  for (const r of references) {
    referenceIds.add(r.id);
    referenceTitles.add(r.title.toLowerCase());
    if (r.originalTitle) referenceTitles.add(r.originalTitle.toLowerCase());
    const tid = mockTmdbMap[r.id] || (/^tmdb-(\d+)$/.exec(r.id)?.[1]);
    if (tid) {
      referenceIds.add(`tmdb-${tid}`);
      referenceIds.add(tid);
    }
  }

  const hasAnimation = references.some(r => r.genres.includes('Animasyon'));
  const hasKidsOrFamily = references.some(r => r.genres.includes('Aile') || r.genres.includes('Çocuk'));
  const pageNum = page + 1;

  // Tüm referans dizilerin TMDB ID'lerini güvenle çöz
  const resolvedIds = await Promise.all(references.map(r => resolveTmdbId(r, signal)));
  const validTmdbIds = resolvedIds.filter((id): id is string => Boolean(id));

  // Eğer hiç TMDB ID bulunamadıysa boş dön
  if (!validTmdbIds.length) return [];

  const candidateMap = new Map<string, { series: TVSeries; hits: number }>();

  const filterAndAdd = (item: TVSeries) => {
    if (referenceIds.has(item.id)) return;
    if (referenceTitles.has(item.title.toLowerCase()) || (item.originalTitle && referenceTitles.has(item.originalTitle.toLowerCase()))) return;
    
    // Çizgi film / animasyon filtresi: Referanslarda animasyon yoksa kesinlikle engelle
    if (!hasAnimation && (
      item.genres.includes('Animasyon') ||
      /çizgi|animasyon|anime|cartoon|manga/i.test(item.synopsis) ||
      /çizgi|animasyon|anime|cartoon/i.test(item.title)
    )) return;

    // Çocuk ve talk show içeriklerini engelle
    if (!hasKidsOrFamily && (
      item.genres.includes('Çocuk') ||
      /peppa|doraemon|sünger bob|spongebob|paw patrol|cocomelon|çocuklar için/i.test(item.title) ||
      /çocuklar için|okul öncesi/i.test(item.synopsis)
    )) return;

    const existing = candidateMap.get(item.id);
    if (existing) {
      existing.hits++;
    } else {
      candidateMap.set(item.id, { series: item, hits: 1 });
    }
  };

  // 1. TMDB /recommendations havuzunu çek
  const recsLists = await Promise.all(
    validTmdbIds.map(tmdbId => getTMDBRecommendations(tmdbId, pageNum, signal))
  );
  recsLists.forEach(list => list.forEach(filterAndAdd));

  // 2. Havuz azsa (/recommendations erken tükendiyse), /similar ile takviye et
  if (candidateMap.size < 8) {
    const simLists = await Promise.all(
      validTmdbIds.map(tmdbId => getTMDBSimilar(tmdbId, pageNum, signal))
    );
    simLists.forEach(list => list.forEach(filterAndAdd));
  }

  // 3. Sonraki sayfalarda hâlâ az adaysa, referans türleriyle discover/tv'den kaliteli yapımları getir
  if (candidateMap.size < 6) {
    const primaryGenres = [...new Set(references.flatMap(r => r.genres))].filter(g => g !== 'Dizi' && g !== 'Animasyon');
    const fallbackGenre = primaryGenres[0] || 'Drama';
    try {
      const pageData = await getTMDBPage({
        mood: 'Tümü',
        genre: fallbackGenre,
        platform: 'Tümü',
        minRating: 6.8,
        status: 'Tümü',
        pacing: [0, 100],
        complexity: [0, 100],
        query: ''
      }, 'match', page, signal);
      
      (pageData.results || []).forEach(item => {
        const mapped = mapTMDB(item);
        if (mapped) filterAndAdd(mapped);
      });
    } catch {
      // sessizce devam et
    }
  }

  const combinedGenres = new Set(references.flatMap(r => r.genres));
  const combinedMoods = new Set(references.flatMap(r => r.moodTags));

  const scored = Array.from(candidateMap.values()).map(({ series: item, hits }) => {
    const genreMatches = item.genres.filter(g => combinedGenres.has(g));
    const moodMatches = item.moodTags.filter(m => combinedMoods.has(m));
    const genreRatio = genreMatches.length / Math.max(1, Math.min(3, combinedGenres.size));
    const moodRatio = moodMatches.length / Math.max(1, Math.min(3, combinedMoods.size));

    let score = 70;
    score += (hits - 1) * 15; // Birden fazla referans dizinin önerdiği yapımlara büyük avantaj
    score += genreRatio * 20;
    score += moodRatio * 15;
    if (item.imdbRating >= 8.0) score += 5;
    else if (item.imdbRating >= 7.5) score += 3;
    else if (item.imdbRating < 6.0) score -= 8;

    const pageCeiling = Math.max(45, 99 - page * 5);
    const finalScore = Math.min(pageCeiling, Math.max(42, Math.round(score)));

    const matchingRefs = references.filter(r =>
      r.genres.some(g => item.genres.includes(g)) || r.moodTags.some(m => item.moodTags.includes(m))
    );
    const matchedTitles = (matchingRefs.length ? matchingRefs : references)
      .slice(0, 2)
      .map(r => r.title)
      .join(' ve ');
    const sharedTopic = genreMatches.slice(0, 2).join(' · ') || 'anlatı ve atmosfer';
    const reason = `${matchedTitles} ile doğrudan bağlantılı ${sharedTopic} ortak damarı.`;

    return {
      ...item,
      matchScore: finalScore,
      aiRecommendationReason: reason,
    };
  });

  return scored.sort((a, b) => b.matchScore - a.matchScore);
}


