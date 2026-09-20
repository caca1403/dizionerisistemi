import type { Filters, TasteProfile, TVSeries } from '../types';
const aliases:Record<string,string[]>={
  'Zihin Yakan':['zihin','mind','gizem','karmaşık','robot','dark'], 'Distopya':['distopya','gelecek','teknoloji','severance'], 'Karanlık/Gerilim':['karanlık','gerilim','polisiye','suç'], 'Siberpunk/Teknoloji':['siber','hacker','teknoloji','yapay'], 'Politik/Güç':['güç','finans','politik','miras'], 'Melankolik':['melankoli','yavaş','duygusal'], 'Yüksek Adrenalin':['hızlı','aksiyon','tempo'], 'Konfor/Rahatlatıcı':['rahat','konfor','komedi','hafif']
};
export function scoreSeries(item:TVSeries, filters:Filters, profile?:TasteProfile|null):number { let score=item.matchScore; const q=filters.query.toLocaleLowerCase('tr'); if(q){ const words=q.split(/\s+/).filter(w=>w.length>2); const text=[item.title,...item.genres,...item.moodTags,item.synopsis].join(' ').toLocaleLowerCase('tr'); const hits=words.filter(w=>text.includes(w)).length; score+=hits*4; Object.entries(aliases).forEach(([mood,terms])=>{if(terms.some(t=>q.includes(t))&&item.moodTags.includes(mood as never))score+=8;}); } if(filters.mood!=='Tümü'&&item.moodTags.includes(filters.mood))score+=8; if(filters.platform!=='Tümü'&&item.platforms.includes(filters.platform))score+=5; if(profile){ const preferred=profile.moods?.length?profile.moods:[profile.mood]; score+=preferred.filter(mood=>item.moodTags.includes(mood)).length*7; if(profile.platform!=='Tümü'&&item.platforms.includes(profile.platform)) score+=6; score += Math.max(-8, 8 - Math.abs(item.emotionProfile.pacing-profile.pacing)*.16); score += Math.max(-8, 8 - Math.abs(item.emotionProfile.complexity-profile.complexity)*.16); } return Math.min(99,Math.max(1,Math.round(score))); }
export function scorePersonalSeries(item: TVSeries, filters: Filters, profile?: TasteProfile | null): number {
  const text = [item.title, item.originalTitle, ...item.genres, ...item.moodTags, item.synopsis].filter(Boolean).join(' ').toLocaleLowerCase('tr');
  let score = item.matchScore > 0 ? item.matchScore * 0.55 : 24;
  const addHits = (values: string[] | undefined, weight: number) => {
    (values || []).forEach(value => { const token = value.toLocaleLowerCase('tr').trim(); if (token && text.includes(token)) score += weight; });
  };
  const query = filters.query.toLocaleLowerCase('tr').trim();
  if (query) addHits(query.split(/\s+/).filter(word => word.length > 2), 7);
  addHits(filters.referenceSignals, 5);

  const referenceSignals = (filters.referenceSignals || []).map(value => value.toLocaleLowerCase('tr'));
  const itemGenres = new Set(item.genres.map(value => value.toLocaleLowerCase('tr')));
  const itemMoods = new Set(item.moodTags.map(value => value.toLocaleLowerCase('tr')));

  if (referenceSignals.length > 0) {
    let genreHits = 0;
    let moodHits = 0;
    referenceSignals.forEach(signal => {
      if (itemGenres.has(signal)) genreHits++;
      if (itemMoods.has(signal)) moodHits++;
    });
    if (genreHits > 0) score += genreHits * 14;
    else score -= 8;

    if (moodHits > 0) score += moodHits * 10;
  }

  if (filters.mood !== 'Tümü' && item.moodTags.includes(filters.mood)) score += 9;
  if (filters.genre !== 'Tümü' && item.genres.includes(filters.genre)) score += 8;
  if (filters.platform !== 'Tümü' && item.platforms.includes(filters.platform)) score += 6;
  if (profile) {
    const moods = profile.moods?.length ? profile.moods : [profile.mood];
    score += moods.filter(mood => item.moodTags.includes(mood)).length * 7;
    addHits(profile.referenceTitles, 10);
    addHits(profile.referenceSignals, 6);
    addHits(profile.keywords, 9);
    (profile.avoidTags || []).forEach(tag => { if (item.moodTags.includes(tag)) score -= 14; });
    if (profile.platform !== 'Tümü' && item.platforms.includes(profile.platform)) score += 6;
    score += Math.max(-8, 8 - Math.abs(item.emotionProfile.pacing - profile.pacing) * .16);
    score += Math.max(-8, 8 - Math.abs(item.emotionProfile.complexity - profile.complexity) * .16);
  }
  score += Math.min(8, item.imdbRating || 0);
  return Math.min(99, Math.max(1, Math.round(score)));
}

/**
 * Calibrates series match scores to emulate the Cine Pulse rating curve:
 * - Sharp, distinct score separation between ranks (no flat clustering).
 * - 95-99% peak score is strictly capped to at most 4-5 items across the list.
 * - Distinct tiers: Elite (95-99%), High (85-91%), Strong (74-82%), Solid (62-71%), Moderate (50-59%), Explorer (38-48%).
 */
export function calibrateCinePulse(items: TVSeries[], page = 0): TVSeries[] {
  return items.map((item, index) => {
    const rank = page * 20 + index;
    let baseScore: number;

    // Strict Cine Pulse curve: At most 4-5 items reach 95-99%.
    // Sharp step-downs from rank 5 onwards.
    if (rank === 0) baseScore = 99;
    else if (rank === 1) baseScore = 99;
    else if (rank === 2) baseScore = 98;
    else if (rank === 3) baseScore = 97;
    else if (rank === 4) baseScore = 95;
    else if (rank === 5) baseScore = 91; // Sharp drop: Cine Pulse contrast!
    else if (rank === 6) baseScore = 88;
    else if (rank === 7) baseScore = 85;
    else if (rank === 8) baseScore = 82;
    else if (rank === 9) baseScore = 78;
    else if (rank === 10) baseScore = 74;
    else if (rank === 11) baseScore = 71;
    else if (rank === 12) baseScore = 68;
    else if (rank === 13) baseScore = 65;
    else if (rank === 14) baseScore = 62;
    else if (rank <= 20) baseScore = Math.max(52, 60 - (rank - 15) * 1.5);
    else if (rank <= 35) baseScore = Math.max(42, 51 - (rank - 21) * 0.7);
    else baseScore = Math.max(38, 41 - (rank - 36) * 0.3);

    const ratingNudge = item.imdbRating >= 8.8 ? 1 : item.imdbRating < 7.0 ? -1 : 0;
    
    // Strict maximum ceiling per rank ensuring never more than 4-5 items in 95-99%
    const maxAllowed = rank <= 1 ? 99 : rank === 2 ? 98 : rank === 3 ? 97 : rank === 4 ? 95 : rank === 5 ? 91 : rank === 6 ? 88 : rank === 7 ? 85 : 82;
    const finalScore = Math.min(maxAllowed, Math.max(38, Math.round(baseScore + ratingNudge)));

    return {
      ...item,
      matchScore: finalScore,
    };
  });
}

export function filterSeries(items: TVSeries[], filters: Filters, profile?: TasteProfile | null) {
  const filtered = items.filter(item => {
    const pacing = item.emotionProfile.pacing;
    const complex = item.emotionProfile.complexity;
    return item.imdbRating >= filters.minRating
      && (filters.status === 'Tümü' || item.status === filters.status)
      && (filters.platform === 'Tümü' || item.platforms.includes(filters.platform))
      && (filters.genre === 'Tümü' || item.genres.includes(filters.genre))
      && (filters.mood === 'Tümü' || item.moodTags.includes(filters.mood))
      && pacing >= filters.pacing[0] && pacing <= filters.pacing[1]
      && complex >= filters.complexity[0] && complex <= filters.complexity[1];
  }).map(item => ({ ...item, matchScore: scorePersonalSeries(item, filters, profile) })).sort((a, b) => b.matchScore - a.matchScore);

  return calibrateCinePulse(filtered, 0);
}
