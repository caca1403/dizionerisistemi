import type { Filters, TasteProfile, TVSeries } from '../types';
const aliases:Record<string,string[]>={
  'Zihin Yakan':['zihin','mind','gizem','karmaşık','robot','dark'], 'Distopya':['distopya','gelecek','teknoloji','severance'], 'Karanlık/Gerilim':['karanlık','gerilim','polisiye','suç'], 'Siberpunk/Teknoloji':['siber','hacker','teknoloji','yapay'], 'Politik/Güç':['güç','finans','politik','miras'], 'Melankolik':['melankoli','yavaş','duygusal'], 'Yüksek Adrenalin':['hızlı','aksiyon','tempo'], 'Konfor/Rahatlatıcı':['rahat','konfor','komedi','hafif']
};
export function scoreSeries(item:TVSeries, filters:Filters, profile?:TasteProfile|null):number { let score=item.matchScore; const q=filters.query.toLocaleLowerCase('tr'); if(q){ const words=q.split(/\s+/).filter(w=>w.length>2); const text=[item.title,...item.genres,...item.moodTags,item.synopsis].join(' ').toLocaleLowerCase('tr'); const hits=words.filter(w=>text.includes(w)).length; score+=hits*4; Object.entries(aliases).forEach(([mood,terms])=>{if(terms.some(t=>q.includes(t))&&item.moodTags.includes(mood as never))score+=8;}); } if(filters.mood!=='Tümü'&&item.moodTags.includes(filters.mood))score+=8; if(filters.platform!=='Tümü'&&item.platforms.includes(filters.platform))score+=5; if(profile){ const preferred=profile.moods?.length?profile.moods:[profile.mood]; score+=preferred.filter(mood=>item.moodTags.includes(mood)).length*7; if(profile.platform!=='Tümü'&&item.platforms.includes(profile.platform)) score+=6; score += Math.max(-8, 8 - Math.abs(item.emotionProfile.pacing-profile.pacing)*.16); score += Math.max(-8, 8 - Math.abs(item.emotionProfile.complexity-profile.complexity)*.16); } return Math.min(99,Math.max(1,Math.round(score))); }
export function scorePersonalSeries(item: TVSeries, filters: Filters, profile?: TasteProfile | null): number {
  // Foundation: High-quality productions in our catalog start at a healthy baseline
  let score = 65;

  // 1. IMDb Rating Quality Curve (Masterpieces & High Quality heavily rewarded)
  const rating = item.imdbRating || 0;
  if (rating >= 9.0) score += 20;
  else if (rating >= 8.5) score += 16;
  else if (rating >= 8.0) score += 13;
  else if (rating >= 7.5) score += 9;
  else if (rating >= 7.0) score += 5;
  else if (rating >= 6.0) score += 2;
  else if (rating > 0) score -= 10;

  // 2. Acclaim & Popularity nudge
  if ((item.popularity || 0) > 100) score += 3;
  else if ((item.popularity || 0) > 40) score += 1;

  // 3. Genre Alignment
  const itemGenresLower = item.genres.map(g => g.toLocaleLowerCase('tr'));
  if (filters.genre !== 'Tümü') {
    const targetGenre = filters.genre.toLocaleLowerCase('tr');
    if (itemGenresLower.includes(targetGenre)) {
      score += 15;
    }
  } else {
    // If browsing all genres, slight reward for rich multi-genre productions
    if (item.genres.length >= 2) score += 3;
  }

  // 4. Mood & Atmosphere Alignment
  const itemMoodsLower = item.moodTags.map(m => m.toLocaleLowerCase('tr'));
  if (filters.mood !== 'Tümü') {
    const targetMood = filters.mood.toLocaleLowerCase('tr');
    if (itemMoodsLower.includes(targetMood)) {
      score += 15;
    } else {
      // Check aliases & synopsis
      const moodAliases = aliases[filters.mood] || [];
      const text = [item.title, item.originalTitle, item.synopsis, ...item.genres, ...item.moodTags]
        .filter(Boolean).join(' ').toLocaleLowerCase('tr');
      if (moodAliases.some(alias => text.includes(alias.toLocaleLowerCase('tr')))) {
        score += 10;
      }
    }
  } else {
    if (item.moodTags.length >= 2) score += 2;
  }

  // 5. Platform Alignment
  if (filters.platform !== 'Tümü' && item.platforms.includes(filters.platform)) {
    score += 4;
  }

  // 6. Search Query / Keyword Boost
  const query = filters.query.toLocaleLowerCase('tr').trim();
  if (query) {
    const words = query.split(/\s+/).filter(w => w.length > 2);
    const text = [item.title, item.originalTitle, item.synopsis, ...item.genres, ...item.moodTags]
      .filter(Boolean).join(' ').toLocaleLowerCase('tr');
    if (item.title.toLocaleLowerCase('tr').includes(query) || (item.originalTitle && item.originalTitle.toLocaleLowerCase('tr').includes(query))) {
      score += 26;
    } else {
      const hits = words.filter(w => text.includes(w)).length;
      score += hits * 8;
    }
  }

  // 7. Reference Signals
  if (filters.referenceSignals && filters.referenceSignals.length > 0) {
    const refSignalsLower = filters.referenceSignals.map(s => s.toLocaleLowerCase('tr').trim());
    let signalHits = 0;
    refSignalsLower.forEach(sig => {
      if (itemGenresLower.includes(sig) || itemMoodsLower.includes(sig)) signalHits++;
    });
    if (signalHits > 0) score += Math.min(18, signalHits * 8);
  }

  // 8. User Taste Profile
  if (profile) {
    const preferredMoods = profile.moods?.length ? profile.moods : [profile.mood].filter(Boolean);
    const moodMatches = preferredMoods.filter(m => item.moodTags.includes(m)).length;
    score += moodMatches * 6;

    if (profile.referenceTitles && profile.referenceTitles.length > 0) {
      const text = [item.title, item.originalTitle].filter(Boolean).join(' ').toLocaleLowerCase('tr');
      profile.referenceTitles.forEach(t => {
        if (text.includes(t.toLocaleLowerCase('tr').trim())) score += 10;
      });
    }

    if (profile.referenceSignals && profile.referenceSignals.length > 0) {
      profile.referenceSignals.forEach(sig => {
        const token = sig.toLocaleLowerCase('tr').trim();
        if (itemGenresLower.includes(token) || itemMoodsLower.includes(token)) score += 6;
      });
    }

    if (profile.keywords && profile.keywords.length > 0) {
      const text = [item.title, item.originalTitle, item.synopsis].filter(Boolean).join(' ').toLocaleLowerCase('tr');
      profile.keywords.forEach(kw => {
        if (text.includes(kw.toLocaleLowerCase('tr').trim())) score += 6;
      });
    }

    if (profile.avoidTags && profile.avoidTags.length > 0) {
      profile.avoidTags.forEach(tag => {
        if (item.moodTags.includes(tag)) score -= 18;
      });
    }

    const pacingDiff = Math.abs(item.emotionProfile.pacing - profile.pacing);
    const compDiff = Math.abs(item.emotionProfile.complexity - profile.complexity);
    score += Math.max(-5, 5 - pacingDiff * 0.12);
    score += Math.max(-5, 5 - compDiff * 0.12);
  } else {
    // Closeness to filter pacing & complexity sliders
    const filterPacingMid = (filters.pacing[0] + filters.pacing[1]) / 2;
    const filterCompMid = (filters.complexity[0] + filters.complexity[1]) / 2;
    if (Math.abs(item.emotionProfile.pacing - filterPacingMid) < 25) score += 3;
    if (Math.abs(item.emotionProfile.complexity - filterCompMid) < 25) score += 3;
  }

  return Math.min(99, Math.max(38, Math.round(score)));
}

/**
 * Calibrates series match scores smoothly:
 * - Preserves natural calculated compatibility (no artificial rank-based score dropoffs).
 * - High-affinity series comfortably achieve 90-99% match across thousands of catalog items.
 * - Subtle organic micro-variation ensures natural presentation without clone clustering.
 */
export function calibrateCinePulse(items: TVSeries[], _page = 0): TVSeries[] {
  return items.map((item) => {
    let score = item.matchScore;

    // Organic micro-variation based on decimal IMDb rating and acclaim
    if (score >= 90) {
      if (item.imdbRating >= 8.8) {
        score = Math.min(99, score + 1);
      } else if (item.imdbRating < 7.6 && score > 90) {
        score = score - 1;
      }
    }

    const finalScore = Math.min(99, Math.max(38, Math.round(score)));

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
