import { series } from '../src/data/mockSeries.ts';
import { scoreThematicItem, findMatchingThemes } from '../src/services/thematicEngine.ts';
import { rerankWithLexicalSignals } from '../src/services/semanticRanker.ts';
import { calibrateCinePulse } from '../src/lib/recommend.ts';

console.log('--- TEST: "uyuşturucu imparatorluğu" ---');
const query = 'uyuşturucu imparatorluğu';
const themes = findMatchingThemes(query);
console.log('Themes matched:', themes.map(t => t.themeName));

let scored = series.map(item => ({
  ...item,
  matchScore: scoreThematicItem(query, item)
})).sort((a, b) => b.matchScore - a.matchScore);

scored = rerankWithLexicalSignals(query, scored);
const calibrated = calibrateCinePulse(scored, 0);

console.log('Top 6 items:');
calibrated.slice(0, 6).forEach((item, index) => {
  console.log(`${index + 1}. [${item.matchScore}%] ${item.title} (IMDb: ${item.imdbRating}) - Genres: ${item.genres.join(', ')}`);
});

const topTitles = calibrated.slice(0, 4).map(i => i.title);
console.log('\nTop 4 titles:', topTitles);

const hasBreakingBad = topTitles.includes('Breaking Bad');
const hasNarcos = topTitles.includes('Narcos');

console.log('Breaking Bad in top 4?', hasBreakingBad);
console.log('Narcos in top 4?', hasNarcos);
console.log('Breaking Bad score:', calibrated.find(i => i.title === 'Breaking Bad')?.matchScore);
console.log('Narcos score:', calibrated.find(i => i.title === 'Narcos')?.matchScore);
