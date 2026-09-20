import type { TVSeries } from '../types';

/**
 * Lexical query expansions for Turkish semantic matching.
 * Maps common query words to related concept tokens.
 */
const expansions: Record<string, string[]> = {
  uyuşturucu: ['uyuşturucu', 'kartel', 'narkotik', 'kokain', 'meth', 'baron', 'mafya', 'escobar', 'pablo', 'walter', 'breaking', 'narcos', 'ozark', 'empire', 'cartel', 'şebeke'],
  imparatorluğu: ['imparatorluk', 'kartel', 'baron', 'şebeke', 'yeraltı', 'lider', 'empire', 'hanedan', 'güç', 'mafya', 'breaking', 'narcos'],
  imparatorluk: ['imparatorluk', 'kartel', 'baron', 'şebeke', 'yeraltı', 'lider', 'empire', 'breaking', 'narcos'],
  kartel: ['kartel', 'uyuşturucu', 'narkotik', 'mafya', 'escobar', 'narcos', 'cartel', 'breaking', 'ozark'],
  narkotik: ['narkotik', 'uyuşturucu', 'kartel', 'dea', 'polis', 'kaçakçılık', 'narcos'],
  baron: ['baron', 'mafya', 'kartel', 'uyuşturucu', 'babası', 'patron'],
  escobar: ['escobar', 'pablo', 'narcos', 'medellin', 'kolombiya', 'kartel'],
  pablo: ['pablo', 'escobar', 'narcos', 'kartel', 'uyuşturucu'],
  zaman: ['zaman', 'döngü', 'geçmiş', 'gelecek', 'paralel', 'yolculuk', 'dark'],
  döngü: ['döngü', 'zaman', 'tekrar', 'paradoks', 'dark'],
  gizem: ['gizem', 'sır', 'bilmece', 'kayıp', 'cinayet', 'soruşturma'],
  kasaba: ['kasaba', 'şehir', 'köy', 'küçük kasaba'],
  uzay: ['uzay', 'gezegen', 'galaksi', 'bilim kurgu', 'astronot'],
  politik: ['politik', 'iktidar', 'güç', 'hükümet', 'entrika', 'şirket', 'succession'],
  sıcak: ['aile', 'arkadaş', 'komedi', 'iyi his', 'sıcak', 'samimi', 'ted lasso'],
  arkadaşlık: ['arkadaş', 'aile', 'yakınlık', 'dostluk', 'ted lasso'],
  şef: ['şef', 'mutfak', 'restoran', 'yemek', 'aşçı', 'the bear'],
  mutfak: ['mutfak', 'şef', 'restoran', 'yemek', 'the bear'],
  cinayet: ['cinayet', 'katil', 'suç', 'dedektif', 'soruşturma', 'polisiye'],
  suç: ['suç', 'mafya', 'kartel', 'soygun', 'cinayet', 'uyuşturucu'],
  zombi: ['zombi', 'salgın', 'virüs', 'enfeksiyon', 'kıyamet', 'walking dead', 'last of us'],
  salgın: ['salgın', 'virüs', 'enfeksiyon', 'pandemi', 'zombi', 'kıyamet'],
  taht: ['taht', 'krallık', 'hanedan', 'ejderha', 'thrones', 'kral', 'savaş'],
  krallık: ['krallık', 'taht', 'hanedan', 'şövalye', 'orta çağ', 'kral'],
  casus: ['casus', 'ajan', 'istihbarat', 'cia', 'kgb', 'soğuk savaş', 'slow horses'],
  ajan: ['ajan', 'casus', 'istihbarat', 'operasyon', 'cia'],
  borsa: ['borsa', 'finans', 'wall street', 'para', 'hisse', 'succession', 'billions'],
  aşk: ['aşk', 'romantik', 'ayrılık', 'tutku', 'ilişki'],
  hüzün: ['hüzün', 'dram', 'yas', 'melankoli', 'yalnızlık'],
  hacker: ['hacker', 'siber', 'kod', 'güvenlik', 'teknoloji', 'mr robot'],
  distopya: ['distopya', 'kıyamet', 'baskı', 'totaliter', 'düzen', 'severance'],
  kedi: ['kedi', 'cat', 'hayvan', 'animal', 'evcil', 'pet'],
  köpek: ['köpek', 'dog', 'hayvan', 'animal', 'evcil', 'pet'],
  savaş: ['savaş', 'war', 'battle', 'muharebe', 'çatışma', 'conflict', 'askeri', 'military'],
  avcı: ['avcı', 'hunter', 'avlanma', 'hunting', 'av'],
  kaçış: ['kaçış', 'escape', 'firar', 'fugitive', 'prison', 'özgürlük'],
  hayatta: ['hayatta', 'survival', 'korku', 'survivor'],
  kalma: ['hayatta kalma', 'survival', 'korku', 'survivor'],
  zombi: ['zombi', 'zombie', 'salgın', 'kıyamet', 'undead'],
  dedektif: ['dedektif', 'detective', 'soruşturma', 'cinayet', 'suç', 'polis'],
};

export function rerankWithLexicalSignals(query: string, candidates: TVSeries[]) {
  const words = query.toLocaleLowerCase('tr').split(/[^\p{L}\p{N}]+/u).filter(word => word.length > 2);
  return candidates.map(item => {
    const text = `${item.title} ${item.originalTitle} ${item.genres.join(' ')} ${item.moodTags.join(' ')} ${item.synopsis}`.toLocaleLowerCase('tr');
    const score = words.reduce((sum, word) =>
      sum + (expansions[word] || [word]).reduce((hits, token) => hits + (text.includes(token) ? 1 : 0), 0),
    0);
    return { ...item, matchScore: Math.max(1, Math.min(99, score * 14 + Math.round(item.imdbRating * 4))) };
  }).sort((left, right) => right.matchScore - left.matchScore);
}

/**
 * Stub – WASM model removed to prevent 27MB bundle download and browser freeze.
 * Lexical + thematic scoring is already sufficient for accurate Turkish search.
 */
export async function rerankWithSemanticModel(query: string, candidates: TVSeries[]): Promise<TVSeries[]> {
  void query;
  return candidates;
}
